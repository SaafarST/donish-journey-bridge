"""
Pre-flight Modal Verification Script
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

def verify_modal_apps():
    print("🔍 Verifying Modal Configuration...\n")
    
    try:
        import modal
    except ImportError:
        print("❌ Modal SDK not installed")
        print("   Run: pip install modal")
        return False
    
    # Check authentication
    try:
        apps = list(modal.app.list())
        print(f"✅ Modal authenticated")
        print(f"   Found {len(apps)} apps\n")
    except Exception as e:
        print(f"❌ Modal authentication failed: {e}")
        print("   Run: modal token new")
        return False
    
    # Check RAG app
    rag_app_name = os.getenv("MODAL_RAG_APP_NAME", "tax-rag")
    rag_class_name = os.getenv("MODAL_RAG_CLASS_NAME", "TaxRAG")
    
    print(f"Looking for: '{rag_app_name}' with class '{rag_class_name}'")
    
    try:
        TaxRAG = modal.Cls.from_name(rag_app_name, rag_class_name)
        print(f"✅ RAG app found and accessible\n")
    except Exception as e:
        print(f"❌ RAG app not found: {e}")
        print(f"   Available apps:")
        for app in apps:
            print(f"   - {app.name}")
        return False
    
    # Check LLM URL
    llm_url = os.getenv("LLM_SERVICE_URL", "").strip()
    if not llm_url:
        print("❌ LLM_SERVICE_URL not configured")
        print("   Add to server/.env")
        return False
    
    print(f"✅ LLM Service URL configured")
    print(f"   {llm_url}\n")
    
    print("="*60)
    print("✅ ALL CHECKS PASSED - Ready for next step!")
    print("="*60)
    return True


if __name__ == "__main__":
    success = verify_modal_apps()
    sys.exit(0 if success else 1)
