import urllib.request
import json
import os

API_KEY = "doo_v1_7295e7f68d7a4ca99a3b424ad4bc7c994799ecc4fea99b12cabd3082221068a7"
API_URL = "https://inference.do-ai.run/v1/models"

req = urllib.request.Request(
    API_URL,
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    method="GET"
)

try:
    with urllib.request.urlopen(req) as response:
        res_data = response.read().decode("utf-8")
        models = json.loads(res_data)
        print("Success! Available models:")
        for model in models.get("data", []):
            print(f"- {model.get('id')}")
except Exception as e:
    if hasattr(e, 'read'):
        print(f"Failed: {e.code} - {e.read().decode('utf-8')}")
    else:
        print(f"Failed: {e}")
