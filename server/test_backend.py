"""
Backend Testing Script - Run after backend is started
"""

import requests
import time

BASE_URL = "http://localhost:8000"

def test_health():
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        data = response.json()
        
        print(f"  Status: {response.status_code}")
        print(f"  Modal RAG: {'✅' if data['modal_rag_connected'] else '❌'}")
        print(f"  LLM Config: {'✅' if data['llm_service_configured'] else '❌'}")
        
        if data['modal_rag_connected'] and data['llm_service_configured']:
            print("  ✅ Backend is healthy!\n")
            return True
        else:
            print("  ⚠️  Backend has issues\n")
            return False
    except Exception as e:
        print(f"  ❌ Failed: {e}\n")
        return False


def test_tax_search():
    print("🔍 Testing tax search...")
    
    payload = {"query": "What is VAT?", "limit": 3}
    
    for attempt in range(1, 3):
        try:
            print(f"  Attempt {attempt}/2...")
            
            response = requests.post(
                f"{BASE_URL}/api/tax/search",
                json=payload,
                timeout=90
            )
            
            if response.status_code == 504 and attempt < 2:
                print("  ⏰ Timeout (cold start) - retrying in 10s...")
                time.sleep(10)
                continue
            
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Success!")
                print(f"     Answer: {len(data['answer'])} chars")
                print(f"     Sources: {len(data['sources'])}")
                print(f"     Time: {data.get('processing_time_ms')}ms")
                return True
            else:
                error = response.json()
                print(f"  ❌ Error: {error.get('error')}")
                return False
                
        except requests.Timeout:
            if attempt < 2:
                print("  ⏰ Timeout - retrying...")
                time.sleep(10)
            else:
                print("  ❌ Timeout after retries")
                return False
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return False
    
    return False


if __name__ == "__main__":
    print("="*60)
    print("  Backend Test Suite")
    print("="*60)
    print()
    
    health_ok = test_health()
    
    if health_ok:
        print("⏳ Waiting 2s...")
        time.sleep(2)
        search_ok = test_tax_search()
    else:
        print("⏭️  Skipping search test\n")
        search_ok = False
    
    print()
    print("="*60)
    print("  Summary")
    print("="*60)
    print(f"  Health: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"  Search: {'✅ PASS' if search_ok else '❌ FAIL'}")
    print("="*60)
    print()
    
    if health_ok and search_ok:
        print("🎉 All tests passed! Backend is production-ready.")
    else:
        print("⚠️  Tests failed. Check errors above.")
