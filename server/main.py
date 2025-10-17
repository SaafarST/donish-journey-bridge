"""
Tax Assistant Backend - FastAPI + Modal Integration
PRODUCTION READY - FINAL VERSION
"""

import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import modal
import aiohttp
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Configuration
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "").strip()
SERVED_MODEL_NAME = os.getenv("SERVED_MODEL_NAME", "ameena")

# Modal Configuration
MODAL_RAG_APP_NAME = os.getenv("MODAL_RAG_APP_NAME", "tax-rag")
MODAL_RAG_CLASS_NAME = os.getenv("MODAL_RAG_CLASS_NAME", "TaxRAG")

# Validate required configuration
if not LLM_SERVICE_URL:
    raise ValueError(
        "❌ LLM_SERVICE_URL not configured!\n"
        "   1. Go to https://modal.com/apps\n"
        "   2. Find your LLM app → Copy the web URL\n"
        "   3. Add to server/.env file"
    )

# Global Modal connection
TaxRAG = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic"""
    global TaxRAG
    
    print(f"\n{'='*60}")
    print(f"  Tax Assistant Backend - Starting Up")
    print(f"{'='*60}")
    print(f"  Modal RAG App: {MODAL_RAG_APP_NAME}")
    print(f"  Modal RAG Class: {MODAL_RAG_CLASS_NAME}")
    print(f"  LLM Service: {LLM_SERVICE_URL[:50]}...")
    print(f"{'='*60}\n")
    
    try:
        print(f"🔗 Connecting to Modal {MODAL_RAG_APP_NAME}...")
        TaxRAG = modal.Cls.from_name(MODAL_RAG_APP_NAME, MODAL_RAG_CLASS_NAME)
        print("✅ Modal TaxRAG connected successfully\n")
    except Exception as e:
        print(f"❌ Failed to connect to Modal TaxRAG: {e}")
        print(f"\n💡 Troubleshooting:")
        print(f"   1. Run: modal token new")
        print(f"   2. Verify app name: modal app list")
        print(f"   3. Check .env file has correct MODAL_RAG_APP_NAME")
        print(f"\n⚠️  Backend will start but tax search will fail\n")
    
    yield
    
    print("\n👋 Shutting down backend...")


# FastAPI App
app = FastAPI(
    title="Tax Assistant API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class TaxSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    limit: int = Field(default=5, ge=1, le=10)
    
    @validator('query')
    def validate_query(cls, v):
        if not v.strip():
            raise ValueError('Query cannot be empty')
        return v.strip()


class TaxSource(BaseModel):
    article: str
    type: str
    content: str
    score: float


class TaxSearchResponse(BaseModel):
    query: str
    answer: str
    sources: List[TaxSource]
    processing_time_ms: Optional[int] = None


class HealthResponse(BaseModel):
    status: str
    modal_rag_connected: bool
    llm_service_configured: bool
    llm_service_url: str
    modal_app_name: str
    modal_class_name: str


# Health Check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check - verify all services"""
    return HealthResponse(
        status="ok" if TaxRAG is not None else "degraded",
        modal_rag_connected=TaxRAG is not None,
        llm_service_configured=bool(LLM_SERVICE_URL),
        llm_service_url=LLM_SERVICE_URL[:50] + "..." if len(LLM_SERVICE_URL) > 50 else LLM_SERVICE_URL,
        modal_app_name=MODAL_RAG_APP_NAME,
        modal_class_name=MODAL_RAG_CLASS_NAME
    )


# Main Tax Search Endpoint
@app.post("/api/tax/search", response_model=TaxSearchResponse)
async def search_tax_code(request: TaxSearchRequest):
    """
    Search Tajikistan Tax Code using RAG + Fine-tuned LLM
    """
    start_time = time.time()
    
    if TaxRAG is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Tax RAG service not available",
                "hint": f"Modal connection failed. Run: modal token new"
            }
        )
    
    try:
        # Step 1: Vector Search via Modal
        print(f"🔍 Searching: '{request.query}'")
        
        rag_instance = TaxRAG()
        
        try:
            rag_results = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: rag_instance.search.remote(request.query, request.limit)
                ),
                timeout=45.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail={
                    "error": "Request timeout",
                    "hint": "Modal services are warming up (cold start). "
                            "This is normal for the first request. "
                            "Please try again in 10-15 seconds."
                }
            )
        
        if not rag_results or len(rag_results) == 0:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "No relevant tax articles found",
                    "query": request.query,
                    "hint": "Try rephrasing your question"
                }
            )
        
        print(f"✅ Found {len(rag_results)} documents")
        
        # Step 2: Build Context
        MAX_CONTEXT_LENGTH = 2000
        context_parts = []
        current_length = 0
        
        for r in rag_results:
            article = r.get('article', 'N/A')
            doc_type = r.get('type', 'unknown')
            content = r.get('content', '')
            
            part = f"[Article: {article}, Type: {doc_type}]\n{content}"
            if current_length + len(part) > MAX_CONTEXT_LENGTH:
                break
            context_parts.append(part)
            current_length += len(part)
        
        if not context_parts:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Failed to build context",
                    "hint": "RAG service returned unexpected format"
                }
            )
        
        context = "\n\n".join(context_parts)
        print(f"📄 Context: {len(context)} chars from {len(context_parts)} docs")
        
        # Step 3: Call LLM
        system_prompt = """You are Ameena, an intelligent assistant specialized in Tajikistan tax law.
Answer questions based on the Tax Code documents provided.
Provide accurate, concise, and understandable answers in Tajik language.
If the documents don't contain enough information, acknowledge this clearly.
Keep answers focused and practical."""

        user_prompt = f"""Question: {request.query}

Relevant Tax Code Documents:
{context}

Based on the documents above, provide a complete and accurate answer in Tajik language."""

        payload = {
            "model": SERVED_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1000,
            "top_p": 0.9
        }
        
        print(f"🤖 Calling LLM...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{LLM_SERVICE_URL}/v1/chat/completions",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        print(f"❌ LLM Error {response.status}: {error_text}")
                        raise HTTPException(
                            status_code=response.status,
                            detail={
                                "error": "LLM service error",
                                "status": response.status,
                                "hint": "Check LLM service URL in .env"
                            }
                        )
                    
                    result = await response.json()
                    
                    # Robust answer extraction
                    try:
                        answer = result["choices"][0]["message"]["content"]
                    except (KeyError, IndexError, TypeError):
                        answer = result.get("choices", [{}])[0].get("message", {}).get("content")
                        if not answer:
                            raise ValueError("No answer in LLM response")
                    
                    print(f"✅ LLM response: {len(answer)} chars")
                    
        except aiohttp.ClientError as e:
            print(f"❌ Network error: {e}")
            raise HTTPException(
                status_code=504,
                detail={
                    "error": "Failed to connect to LLM service",
                    "hint": "Check internet connection and LLM URL"
                }
            )
        
        # Step 4: Format Response
        sources = []
        for r in rag_results[:3]:
            content = r.get('content', '')
            sources.append(TaxSource(
                article=r.get('article', 'N/A'),
                type=r.get('type', 'unknown'),
                content=content[:200] + "..." if len(content) > 200 else content,
                score=round(r.get('score', 0.0), 4)
            ))
        
        processing_time = int((time.time() - start_time) * 1000)
        print(f"⏱️  Total: {processing_time}ms\n")
        
        return TaxSearchResponse(
            query=request.query,
            answer=answer,
            sources=sources,
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail={
                "error": "Request timeout",
                "hint": "Services may be cold starting. Wait 10s and retry."
            }
        )
    except Exception as e:
        print(f"💥 Unexpected error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "type": type(e).__name__,
                "message": str(e)
            }
        )


# Error Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail if isinstance(exc.detail, dict) else {"error": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"💥 Unhandled exception: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "type": type(exc).__name__
        }
    )


# Run Server
if __name__ == "__main__":
    import uvicorn
    
    print(f"""
╔══════════════════════════════════════════════════════════╗
║       Tax Assistant Backend Server                       ║
╠══════════════════════════════════════════════════════════╣
║  Port:           {PORT}                                  ║
║  Frontend:       {FRONTEND_URL}                          ║
║  Modal RAG App:  {MODAL_RAG_APP_NAME}                    ║
║  LLM Service:    {LLM_SERVICE_URL[:30]}...               ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=True,
        log_level="info"
    )
