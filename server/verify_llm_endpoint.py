"""
LLM Endpoint Format Verification Script
Tests that your LLM service returns the expected OpenAI-compatible format
"""

import os
import asyncio
import aiohttp
from dotenv import load_dotenv

load_dotenv()

LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "").strip()

async def test_llm_endpoint():
    print("🧪 Testing LLM Endpoint Format\n")
    print(f"URL: {LLM_SERVICE_URL}\n")
    
    if not LLM_SERVICE_URL:
        print("❌ LLM_SERVICE_URL not configured in .env")
        return False
    
    test_payload = {
        "model": os.getenv("SERVED_MODEL_NAME", "ameena"),
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'test successful' in one word."}
        ],
        "temperature": 0.1,
        "max_tokens": 10
    }
    
    try:
        print("📤 Sending test request...")
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{LLM_SERVICE_URL}/v1/chat/completions",
                json=test_payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                
                print(f"📥 Response status: {response.status}\n")
                
                if response.status != 200:
                    error_text = await response.text()
                    print(f"❌ Error: {error_text}\n")
                    return False
                
                data = await response.json()
                
                # Verify structure
                print("🔍 Checking response structure...")
                
                if "choices" not in data:
                    print("❌ Missing 'choices' field")
                    return False
                print("✅ Has 'choices' field")
                
                if not data["choices"]:
                    print("❌ 'choices' array is empty")
                    return False
                print("✅ choices[0] exists")
                
                try:
                    content = data["choices"][0]["message"]["content"]
                    print(f"✅ Has message.content")
                    print(f"   Response: '{content}'\n")
                except (KeyError, IndexError, TypeError) as e:
                    print(f"❌ Cannot access choices[0].message.content: {e}")
                    return False
                
                print("="*60)
                print("✅ LLM ENDPOINT FORMAT VERIFIED!")
                print("="*60)
                print("\nYour LLM uses correct OpenAI-compatible format:")
                print("  POST /v1/chat/completions")
                print("  { choices: [{ message: { content: '...' }}] }")
                print("\n🎉 Backend will work correctly!")
                
                return True
                
    except asyncio.TimeoutError:
        print("⏰ Timeout - may be cold start. Retry in 10s.")
        return False
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")
        return False


if __name__ == "__main__":
    print("="*60)
    print("  LLM Endpoint Format Verification")
    print("="*60)
    print()
    
    success = asyncio.run(test_llm_endpoint())
    
    if not success:
        print("\n⚠️  VERIFICATION FAILED")
        print("\nTroubleshooting:")
        print("1. Check LLM_SERVICE_URL in .env")
        print("2. Open URL in browser to verify it's running")
        print("3. Wait 10s for cold start, retry")
    
    exit(0 if success else 1)
