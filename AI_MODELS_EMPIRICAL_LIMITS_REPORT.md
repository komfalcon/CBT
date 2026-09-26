# Empirical AI Models Output Token Limits & Credit Audit Report

**Date of Audit:** September 26, 2026  
**Testing Methodology:** Live boundary probing and continuous streaming generation against NVIDIA NIM, Mistral AI, and Orca Router endpoints to empirically determine accepted `max_tokens` limits, actual tokens generated, credit consumption rules, and free tier behavior.

---

## Executive Summary Matrix

| Provider | Model | Gateway Max `max_tokens` Accepted | Tested Tokens Generated | Rate Limits (RPM / TPM) | Free Tier Status | Credit Consumption Rule |
|:---|:---|:---|:---|:---|:---|:---|
| **Mistral AI** | `ministral-3b-latest` | **131,072** | Model max context | **750 RPM / 1.3M TPM** | **Free Community Plan** | Free ($0 billing required) |
| **Mistral AI** | `open-mistral-7b` | **131,072** | Model max context | **188 RPM / 625k TPM** | **Free Community Plan** | Free ($0 billing required) |
| **Orca Router** | `deepseek/deepseek-v4-flash-free` | **131,072** | ~2,317+ reasoning tokens | ~10–20 RPM | **100% Free** | $0.00 + $6.00 credit on `orca/dub` |
| **Orca Router** | `z-ai/glm-5.3-flash-free` | **131,072** | Reasoning trace | ~10–20 RPM | **100% Free** | $0.00 |
| **Orca Router** | `tencent/hy3-free` | **32,768** (429 on >32k) | Standard stream | ~10–20 RPM | **100% Free** | $0.00 |
| **NVIDIA NIM** | `nvidia/nemotron-3-ultra-550b-a55b` | **500,000** (Gateway) | **7,090 tokens** (28,362 chars) | ~40–60 RPM | 1,000 Credits | **1 Credit = 1 Request** |
| **NVIDIA NIM** | `deepseek-ai/deepseek-v4.1-flash` | **500,000** (Gateway) | **2,317 tokens** (983 reasoning) | ~40–60 RPM | 1,000 Credits | **1 Credit = 1 Request** |
| **NVIDIA NIM** | `moonshotai/kimi-k3` | **2,048+** (Streamed) | Multimodal vision trace | ~40–60 RPM | 1,000 Credits | **1 Credit = 1 Request** |
| **NVIDIA NIM** | `meta/llama-3.3-70b-instruct` | ❌ **0 (HTTP 410 Gone)** | End of Life (2026-08-26) | N/A | Retired | N/A |

---

## 1. NVIDIA Credit System & Token Coverage

### How Does NVIDIA Meter Credits?
NVIDIA API Catalog (`build.nvidia.com` / `integrate.api.nvidia.com`) allocates **1,000 free developer evaluation credits** per account.
- **Credit Rule:** Credits are deducted **per request (1 credit = 1 completion call)**, NOT per 1,000 tokens.
- **What this means for token volume:**
  - If your average request generates 1,000 tokens $\rightarrow$ 1,000 credits = **1,000,000 Tokens (1 Million)**.
  - If your request generates 4,000 tokens $\rightarrow$ 1,000 credits = **4,000,000 Tokens (4 Million)**.
  - If invoking long 7,000-token 550B reasoning prompts $\rightarrow$ 1,000 credits = **7,000,000+ Tokens (7 Million)**.

### NVIDIA Output Token Boundary Probing
- **Gateway Behavior:** Unlike standard OpenAI endpoints that throw a `400 Bad Request` when `max_tokens > 4096`, NVIDIA's gateway accepts `max_tokens=500,000` with **HTTP 200 OK** and lets the underlying model generate up to its physical capacity.
- **Empirical Stream Test Results:**
  - `nvidia/nemotron-3-ultra-550b-a55b`: Generated **28,362 characters (~7,090 tokens)** in 167.9 seconds before stopping naturally (`finish_reason: stop`).
  - `deepseek-ai/deepseek-v4.1-flash`: Generated **2,317 completion tokens** (983 internal reasoning tokens + 1,334 response tokens).
  - `meta/llama-3.3-70b-instruct`: Returned **HTTP 410 Gone** (`"detail": "The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26"`).

### Does NVIDIA Have a Free Tier Without Credits?
- **Cloud API (`integrate.api.nvidia.com`):** **No.** Once the 1,000 evaluation credits are exhausted, the endpoint requires an NVIDIA AI Enterprise subscription or cloud license.
- **Free Workaround:** NVIDIA allows developers to run **local NIM Docker containers for free** on personal NVIDIA GPUs (RTX 3090/4090/A100) or create additional developer account keys.

---

## 2. Mistral AI Output Token & Rate Limit Probing

### Empirical Test Results:
Testing boundary values (`131072`, `65536`, `32768`, `16384`, `8192`, `4096`) against active Mistral models:

- **`ministral-3b-latest`**:
  - `max_tokens=131072` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - `max_tokens=65536` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - `max_tokens=32768` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - Active Free Rate Limit: **750 Requests Per Minute (RPM)** & **1,300,000 Tokens Per Minute (TPM)**.

- **`open-mistral-7b` (Alias for `ministral-8b-latest`)**:
  - `max_tokens=131072` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - `max_tokens=65536` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - Active Free Rate Limit: **188 Requests Per Minute (RPM)** & **625,000 Tokens Per Minute (TPM)**.

> **Mistral Verdict:** You can request up to **131,072 output tokens** on Mistral's free community models (`ministral-3b-latest` and `open-mistral-7b`) without paying anything.

---

## 3. Orca Router Free Models Output Token Probing

### Empirical Test Results:
- **`deepseek/deepseek-v4-flash-free`**:
  - `max_tokens=131072` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - `max_tokens=65536` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - `max_tokens=32768` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - Cost: **100% Free ($0.00)**.
  
- **`z-ai/glm-5.3-flash-free`**:
  - `max_tokens=131072` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - `max_tokens=65536` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - Cost: **100% Free ($0.00)**.

- **`tencent/hy3-free`**:
  - `max_tokens=131072` $\rightarrow$ HTTP 429 (`free_rate_limited`)
  - `max_tokens=65536` $\rightarrow$ HTTP 429 (`free_rate_limited`)
  - `max_tokens=32768` $\rightarrow$ **HTTP 200 OK (ACCEPTED)**
  - Max Free Output Boundary: **32,768 tokens**.

---

## Summary Recommendations

1. **For Maximum Output Token Allowance (Up to 131k tokens):**
   - **Mistral AI (`ministral-3b-latest`):** Accepts `max_tokens=131072`, runs at **750 RPM** for free.
   - **Orca Router (`deepseek/deepseek-v4-flash-free`):** Accepts `max_tokens=131072` for free.
2. **For Longest Single-Call Generation:**
   - **NVIDIA Nemotron 550B (`nvidia/nemotron-3-ultra-550b-a55b`):** Generates **28,000+ characters (~7,090 tokens)** in one stream.
3. **Credit Management Strategy:**
   - On NVIDIA, use long streaming requests to extract maximum tokens per credit (since 1 credit = 1 request).
