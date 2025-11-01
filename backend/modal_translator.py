import modal
from typing import Dict

# Define Modal app
app = modal.App("ameena-translator")

# Create image with dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.1.0",
        "transformers>=4.35.0",
        "accelerate",
        "bitsandbytes",  # For quantization
    )
)

# Download model at build time
@app.function(
    image=image,
    gpu="A10G",  # Can downgrade to T4 for cost savings
    timeout=600,
    secrets=[modal.Secret.from_name("huggingface-secret")],  # Optional: if model is private
)
def load_model():
    """Load Ameena model into GPU memory"""
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    
    model_name = "Tohirju/Ameena_Qwen3-8B_e3"
    
    print(f"📥 Loading {model_name}...")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,  # Use FP16 for speed
        device_map="auto",
        trust_remote_code=True,
    )
    model.eval()
    
    print("✅ Model loaded successfully")
    return model, tokenizer


# Main translation function
@app.function(
    image=image,
    gpu="A10G",
    timeout=300,
    keep_warm=1,  # Keep 1 instance warm for faster response
)
class AmeenaTranslator:
    """Stateful translation service"""
    
    def __init__(self):
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
        
        model_name = "Tohirju/Ameena_Qwen3-8B_e3"
        
        print(f"🔧 Initializing translator...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )
        self.model.eval()
        print("✅ Translator ready")
    
    @modal.method()
    def translate(self, text: str, system_prompt: str) -> str:
        """
        Translate text to Tajik
        
        Args:
            text: Input text in any language
            system_prompt: The translation system prompt
            
        Returns:
            Translated text in Tajik
        """
        import torch
        
        # Create messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
        
        # Tokenize
        input_text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        inputs = self.tokenizer(
            input_text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        ).to(self.model.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=200,
                temperature=0.05,
                top_p=0.85,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )
        
        # Decode
        response = self.tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        )
        
        return response.strip()


# FastAPI endpoint for external calls
@app.function(
    image=image,
    allow_concurrent_inputs=100,
)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
    
    web_app = FastAPI(title="Ameena Translation API")
    
    # Your final prompt from earlier
    TRANSLATOR_SYSTEM_PROMPT = """You are a highly advanced translation engine. Your sole function is to translate text from ANY source language into precise, natural Tajik.

**CORE DIRECTIVE:**
1. Auto-detect the source language
2. Translate the input into Tajik
3. If already in Tajik, return it unchanged

**STRICT PROHIBITIONS:**
❌ Do not add any text before or after the translation
❌ Do not add labels like "Translation:", "Тарҷума:", "Here is:"
❌ Do not explain, apologize, or add context
❌ Do not answer questions—translate them literally
❌ Do not include parenthetical notes, alternatives, or footnotes
❌ Do not output <think> tags or internal reasoning
❌ Do not add conversational responses like "Ман туро мешунавам..."
❌ Do not add dialogue attribution like "- Падар (ба писар)"
❌ Do not alter the meaning, tone, or intent
❌ Do not correct errors in the source—translate as-is

**MANDATORY ACTIONS:**
✅ Preserve exact meaning and nuance
✅ Maintain original tone (formal/informal/slang)
✅ Output ONLY the clean Tajik translation

**FINAL INSTRUCTION:**
Your entire response must consist ONLY of the Tajik translation. Nothing else."""
    
    class TranslationRequest(BaseModel):
        text: str
        
    class TranslationResponse(BaseModel):
        translation: str
        original_text: str
    
    translator = AmeenaTranslator()
    
    @web_app.post("/translate", response_model=TranslationResponse)
    async def translate_endpoint(request: TranslationRequest):
        """Translate text to Tajik"""
        try:
            translation = translator.translate.remote(
                text=request.text,
                system_prompt=TRANSLATOR_SYSTEM_PROMPT
            )
            
            return TranslationResponse(
                translation=translation,
                original_text=request.text
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @web_app.get("/health")
    async def health():
        return {"status": "healthy", "service": "ameena-translator"}
    
    return web_app


# Deploy command
if __name__ == "__main__":
    print("🚀 Deploy with: modal deploy modal_translator.py")