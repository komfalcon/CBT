# Master Integration Strategy: Multi-LLM Free Keys & Anti-Truncation Router

**Problem:** Default UI models (like standard Gemini free tiers or low-token chat interfaces) frequently hit `max_tokens` limits, causing responses to break off mid-sentence, truncate JSON payloads, or drop connections.

**Solution:** An automated Multi-LLM Router that prioritizes high-output free models (Mistral 131k tokens, Orca DeepSeek V4 131k tokens, NVIDIA 550B ultra models) with automatic fallbacks and auto-continuation logic.

---

## 1. Free Keys Routing Architecture

```
                                  ┌── 1. Mistral AI (`ministral-3b-latest`) ─────► 750 RPM | 131,072 max_tokens (Primary)
                                  │
User Query / Chat Request ───────┼── 2. Orca Router (`deepseek-v4-flash-free`) ──► 10-20 RPM | 131,072 max_tokens + Reasoning
                                  │
                                  └── 3. NVIDIA NIM (`nemotron-3-ultra-550b`) ───► 1,000 Credits | 7,000+ Output Tokens
```

---

## 2. Key Allocation Matrix

| Tier & Role | Provider & Model | Max Output Limit | RPM | Why Use It Here |
|:---|:---|:---|:---|:---|
| **Tier 1: Fast Chat & Standard Text (Primary)** | **Mistral AI** (`ministral-3b-latest`) | **131,072 tokens** | **750 RPM** | Will NEVER truncate text. Generates full long-form articles in seconds. |
| **Tier 1 (Backup): Fast Chat** | **Mistral AI** (`open-mistral-7b`) | **131,072 tokens** | **188 RPM** | Seamless fallback if 3B model is busy. |
| **Tier 2: Deep Reasoning & Complex Tasks** | **Orca Router** (`deepseek/deepseek-v4-flash-free`) | **131,072 tokens** | **10-20 RPM** | Free DeepSeek V4 reasoning trace + final answer. |
| **Tier 3: Flagship 550B Heavy Duty** | **NVIDIA NIM** (`nvidia/nemotron-3-ultra-550b-a55b`) | **7,090+ tokens** | 40-60 RPM | 550 Billion parameter model for ultra-complex prompts. |
| **Vision & Image Tasks** | **NVIDIA NIM** (`moonshotai/kimi-k3`) | **2,048+ tokens** | 40-60 RPM | Multimodal image understanding + visual reasoning. |

---

## 3. How Anti-Truncation Works (Auto-Continuation)

When a model outputs text and reaches its limit, standard interfaces cut off abruptly. Our router fixes this via 3 layers of protection:

1. **High Token Ceiling:** Sets `max_tokens: 16384` or `32768` by default (instead of default 2048/4096).
2. **Finish Reason Monitoring:** Inspects `finish_reason`. If `finish_reason === "length"`, the router automatically appends a background prompt:
   ```json
   {
     "role": "assistant", "content": "<partial_truncated_text>"
   },
   {
     "role": "user", "content": "Continue exactly where you left off without repeating previous text."
   }
   ```
3. **Seamless Concatenation:** Merges the continued response into the stream so the end-user receives a single, complete output.

---

## 4. Production Code Usage (`frontend/src/services/aiRouter.ts`)

You can call the router anywhere in your React frontend or Node backend:

```typescript
import { aiRouter } from './services/aiRouter';

// 1. Fast Chat / General Text (Uses Mistral 750 RPM free tier with 131k token limit)
const response = await aiRouter.generateCompletion([
  { role: 'user', content: 'Explain quantum mechanics in complete detail with code examples.' }
], { taskType: 'fast_chat' });

console.log(response.content);

// 2. Deep Reasoning & Exam Question Generation (Uses free DeepSeek V4)
const reasoningResp = await aiRouter.generateCompletion([
  { role: 'user', content: 'Generate 10 advanced JAMB Physics questions with step-by-step solutions.' }
], { taskType: 'deep_reasoning' });

console.log(reasoningResp.content);

// 3. Streaming Response into UI
await aiRouter.generateCompletion([
  { role: 'user', content: 'Write a full essay on African history.' }
], {
  taskType: 'ultra_long',
  onChunk: (chunkText) => {
    // Append to live chat UI state
    setChatText((prev) => prev + chunkText);
  }
});
```
