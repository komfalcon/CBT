# Deep Dive: Text-to-Speech (TTS) Architecture in `phuc-nt/my-translator`

**Source Repository:** [https://github.com/phuc-nt/my-translator](https://github.com/phuc-nt/my-translator)  
**Author:** Phúc Nguyễn (`@phuc-nt`)  
**Technology Stack:** Tauri v2 (Rust Backend), Web UI (JavaScript / HTML5), `sherpa-onnx`, `tokio-tungstenite`, Web Speech API.

---

## 1. What is `my-translator` All About?

**My Translator** is an open-source, desktop speech translation application designed for real-time meetings, streams, and presentations. It captures incoming system audio (e.g., from Zoom, YouTube, or podcasts) or local microphone audio, runs speech-to-text translation (via Soniox, OpenAI Realtime, Qwen, or local MLX), and renders live dual-language subtitles.

### The Role of TTS in the App
The application includes a comprehensive **Text-to-Speech (TTS)** engine that acts as a real-time interpreter. As translation text streams across the screen, the TTS module synthesizes and reads the translated sentences aloud into the user's headphones or speakers.

To accommodate different budgets, environments, and languages, the repository implements a multi-provider TTS architecture ranging from **100% offline local models** and **free reverse-engineered neural cloud endpoints** to **premium commercial APIs**.

---

## 2. TTS Provider Comparison Matrix

| Provider | Mechanism / Engine | Cost | API Key Required? | Offline / Local? | Supported Languages | Typical Latency | Audio Format |
|---|---|---|---|---|---|---|---|
| **Microsoft Edge TTS** ⭐ | WebSocket to Edge Read-Aloud | **Free** | ❌ No | ❌ (Needs Internet) | 70+ languages (hundreds of voices) | ~300ms – 500ms | 24kHz 48kbps MP3 |
| **Local (Offline) TTS** | Piper VITS via `sherpa-onnx` | **Free** | ❌ No |  **100% Offline** | Vietnamese, English (expandable) | ~15× real-time CPU | Raw PCM / WAV (16k–22kHz) |
| **Web Speech API** | Browser `speechSynthesis` | **Free** | ❌ No |  **Local OS Voices** | System-dependent | Instant (~0ms) | OS Audio Buffer |
| **Google Free TTS** | Android TTS endpoint | **Free** | ❌ Optional | ❌ (Needs Internet) | 50+ languages | ~300ms – 600ms | audio/mpeg MP3 |
| **Google Cloud TTS** | Google Chirp 3 HD | Free (1M chars/mo) |  Yes (GCP Key) | ❌ Cloud | Global | ~200ms – 500ms | Linear PCM / MP3 |
| **ElevenLabs** | ElevenLabs REST API | Paid ($5–$22/mo) |  Yes | ❌ Cloud | Global | ~500ms – 800ms | MP3 stream |
| **TikTok TTS** | Reverse-engineered mobile API | **Free** | ⚠️ Session ID | ❌ Cloud | EN, ES, FR, etc. | ~400ms – 700ms | Base64 MP3 |

---

## 3. Detailed Breakdown of Each TTS Provider

---

### A. Microsoft Edge TTS (The Star Feature — Free Neural Audio)
- **Source Files:** [`src-tauri/src/commands/edge_tts.rs`](file:///C:/Users/DELL/.gemini/antigravity/brain/f8ccf9be-8a30-439b-9374-75aa4d27a865/scratch/my_translator_tts/src-tauri_src_commands_edge_tts.rs) & `src/js/edge-tts.js`
- **Why it matters:** It provides the exact same natural, human-grade neural voices found in Microsoft Edge and Azure Cognitive Services, but **without requiring an Azure account or paying subscription fees**.

#### How the Implementation Works:
1. **WebSocket Handshake:** Connects directly to Microsoft's Bing speech endpoint:
   ```
   wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1
   ```
2. **Microsoft DRM (`Sec-MS-GEC`) Token Derivation:** Microsoft requires a cryptographic DRM header on each connection. The repository generates this token by:
   - Calculating the Windows File Time Epoch: `timestamp_seconds + 11,644,473,600`.
   - Rounding down to the nearest 5 minutes (300 seconds).
   - Converting into 100-nanosecond intervals.
   - Hashing the intervals + hardcoded trusted client token (`6A5AA1D4EAFF4E9FB37E23D68491D6F4`) using **SHA-256**.
   - Returning the uppercase hex string.
3. **SSML Generation:** Formats the input text into valid W3C SSML:
   ```xml
   <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
     <voice name='en-US-JennyNeural'>
       <prosody pitch='+0Hz' rate='+20%' volume='+0%'>Hello, world!</prosody>
     </voice>
   </speak>
   ```
4. **Binary Audio Assembly:** The WebSocket returns binary frames containing 2-byte header lengths followed by raw MP3 audio chunks. The Rust backend streams these, concatenates the byte vectors until receiving `Path:turn.end`, and returns base64 MP3 to the frontend.

---

### B. Local (Offline) Neural TTS — Piper + sherpa-onnx
- **Source File:** `src-tauri/src/commands/local_tts.rs`
- **Why it matters:** Completely private, 100% offline, zero network requests, and zero risk of rate limits or service deprecation.

#### How the Implementation Works:
1. **Engine:** Statically links `sherpa-onnx` (a high-performance, embedded ONNX speech engine created by the Next-gen Kaldi team).
2. **Models:** Utilizes **Piper (VITS)** models, which are compact (~60 MB to 70 MB) text-to-speech models trained with variational inference:
   - English: `en_US-ryan-medium` (22.05 kHz), `en_US-lessac-medium` (22.05 kHz).
   - Vietnamese: `vi_VN-vais1000-medium` (22.05 kHz), `vi_VN-25hours_single-low` (16 kHz).
3. **Phonemizer:** Each voice tarball bundles `espeak-ng-data` internally, eliminating external phonemizer dependencies.
4. **On-Demand Voice Manager:** The app provides a built-in voice downloader that checks SHA-256 checksums, un-tarballs the `.tar.bz2` archive to disk, and deletes models on demand.

---

### C. Web Speech API (Client-Side Native)
- **Source File:** [`src/js/web-speech-tts.js`](file:///C:/Users/DELL/.gemini/antigravity/brain/f8ccf9be-8a30-439b-9374-75aa4d27a865/scratch/my_translator_tts/src_js_web-speech-tts.js)
- **Why it matters:** Requires zero downloads and zero backend servers.
- **How it works:** Directly leverages `window.speechSynthesis` and `SpeechSynthesisUtterance`:
  ```javascript
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.2;
  window.speechSynthesis.speak(utterance);
  ```
- **Strengths:** 0ms latency, native to iOS, Android, macOS, and Windows.

---

### D. Google Free TTS
- **Source Files:** [`src-tauri/src/commands/google_free_tts.rs`](file:///C:/Users/DELL/.gemini/antigravity/brain/f8ccf9be-8a30-439b-9374-75aa4d27a865/scratch/my_translator_tts/src-tauri_src_commands_google_free_tts.rs) & `src/js/google-free-tts.js`
- **Endpoint:** `https://www.google.com/speech-api/v2/synthesize`
- **Mechanism:** Passes `client=android-tts` with `enc=mpeg`. Returns lightweight MP3 audio.

---

### E. Commercial Cloud Providers
- **Google Cloud TTS (Chirp 3 HD):** Google's flagship near-human quality model. Configurable in the settings by providing a GCP API key with `texttospeech.googleapis.com` enabled. (1 Million characters free per month).
- **ElevenLabs:** Highest-tier expressive voice cloning via standard REST API calls with user-provided `xi-api-key`.

---

## 4. Key Engineering Highlights in `my-translator`

1. **Audio Queue & Backpressure Handling:**
   In real-time speech translation, subtitles arrive rapidly. If the user speaks faster than the TTS reads, queues can back up. The author solved this in `src/js/*` using a **bounded queue (`MAX_QUEUE = 10`) with drop-oldest semantics**:
   ```javascript
   this._queue.push(text.trim());
   while (this._queue.length > MAX_QUEUE) this._queue.shift();
   ```
2. **WebSocket Timeout Guards:**
   In `edge_tts.rs`, reading from the Microsoft WebSocket is wrapped with a 10-second message timeout. If Microsoft's server stalls without sending `turn.end`, the socket automatically terminates rather than hanging the worker thread indefinitely.

---

## 5. How to Leverage This in CBT & Aurikrex

If you want to add speech synthesis into **Aurikrex Exam Arena / CBT** (e.g. for reading exam instructions, screen-reader accessibility for visually impaired candidates, or listening comprehension passages in JAMB Use of English):

### Option 1: Browser-Native (Zero Setup, Zero Cost)
Use the pattern from `src/js/web-speech-tts.js`. Add a React hook `useSpeech()` to read question prompts directly using the student's device voices.

### Option 2: Studio Quality Cloud Audio (Free via Edge-TTS)
Use Microsoft's Edge TTS protocol on your Node.js or Python backend. 
- In Node.js: `npm install edge-tts` or `@andresaya/edge-tts`
- In Python: `pip install edge-tts`
```python
import edge_tts
communicate = edge_tts.Communicate("Candidate John Doe, your 2-hour JAMB Exam starts now.", "en-NG-EzinneNeural")
await communicate.save("instruction.mp3")
```
*(Notice: Microsoft Edge even provides Nigerian English neural voices like `en-NG-EzinneNeural` and `en-NG-AbeoNeural` perfect for JAMB UTME candidates!)*
