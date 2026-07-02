import urllib.request
import json
import time

API_KEY = "doo_v1_e34216c62ca589898497de42ed157735f9ae238f828b7e3378d76fec667141d1"
API_URL = "https://inference.do-ai.run/v1/models"
CHAT_URL = "https://inference.do-ai.run/v1/chat/completions"

# 1. Get all models
req = urllib.request.Request(
    API_URL,
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    method="GET"
)

models = []
try:
    with urllib.request.urlopen(req) as response:
        res_data = response.read().decode("utf-8")
        models_data = json.loads(res_data)
        models = [m.get('id') for m in models_data.get('data', [])]
except Exception as e:
    print(f"Error fetching models: {e}")
    exit(1)

print(f"Testing {len(models)} models for chat authorization...")

authorized_models = []
for model in models:
    if any(keyword in model for keyword in ["embedding", "reranker", "image", "stable-diffusion", "wan2", "tts"]):
        continue
        
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 5
    }
    
    req_chat = urllib.request.Request(
        CHAT_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        # Set a short timeout (e.g., 4 seconds) to prevent hanging
        with urllib.request.urlopen(req_chat, timeout=4) as response:
            res_data = response.read().decode("utf-8")
            print(f"AUTHORIZED: {model}")
            authorized_models.append(model)
    except urllib.error.HTTPError as e:
        # If it's a 403 or 400, print failure reason to help debug
        print(f"FAILED: {model} -> {e.code}")
    except Exception as e:
        print(f"FAILED: {model} -> {str(e)}")

print("\n--- Summary of Authorized Chat Models ---")
for m in authorized_models:
    print(f"- {m}")
