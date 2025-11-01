import torch
import numpy as np
import asyncio
from typing import AsyncGenerator
from transformers import VitsModel, AutoTokenizer
from pipecat.services.tts_service import TTSService
from pipecat.frames.frames import TTSStartedFrame, TTSStoppedFrame, ErrorFrame, TTSAudioRawFrame
import logging

logger = logging.getLogger(__name__)

class FacebookTTSTajik(TTSService):
    """
    Facebook MMS TTS for Tajik - Speed optimized version
    """
    
    def __init__(
        self,
        model_name: str = "facebook/mms-tts-tgk",
        optimize_for_speed: bool = True,
        **kwargs
    ):
        super().__init__(**kwargs)
        
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        self._model_name = model_name
        self._sample_rate = 16000
        self._optimize_for_speed = optimize_for_speed
        
        self._load_models()
    
    def _load_models(self):
        """Load Facebook MMS TTS model"""
        try:
            logger.info(f"📥 Loading {self._model_name}...")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(self._model_name)
            
            # Load model with speed optimizations
            self.model = VitsModel.from_pretrained(
                self._model_name,
                torch_dtype=torch.float32,  # MPS requires float32
            )
            
            if self._optimize_for_speed:
                self.model.eval()
                # Compile model for faster inference (PyTorch 2.0+)
                if hasattr(torch, 'compile'):
                    logger.info("🔥 Compiling model for speed...")
                    self.model = torch.compile(self.model, mode="reduce-overhead")
            
            self.model.to(self.device)
            logger.info(f"✅ TTS loaded on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load TTS: {e}")
            raise
    
    def _prepare_text(self, text: str) -> str:
        """Clean text for TTS"""
        import re
        
        # Remove special characters that cause issues
        text = re.sub(r'<think[^>]*>.*?</think>', '', text, flags=re.DOTALL)
        text = re.sub(r'[<>]', '', text)
        text = text.strip()
        
        if not text:
            text = "."
        
        return text
    
    def _generate_speech(self, text: str) -> np.ndarray:
        """Generate speech with speed optimization"""
        try:
            text = self._prepare_text(text)
            
            # Tokenize
            inputs = self.tokenizer(text, return_tensors="pt")
            inputs = {k: v.long().to(self.device) for k, v in inputs.items()}
            
            # Generate audio
            with torch.no_grad():
                if self._optimize_for_speed:
                    # Faster inference settings
                    output = self.model(**inputs, noise_scale=0.667, length_scale=0.8).waveform
                else:
                    # Quality settings
                    output = self.model(**inputs).waveform
            
            # Convert to numpy
            audio_array = output.squeeze().cpu().numpy()
            audio_array = np.clip(audio_array, -1.0, 1.0)
            
            return audio_array.astype(np.float32)
            
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            return np.zeros(self._sample_rate, dtype=np.float32)
    
    async def run_tts(self, text: str) -> AsyncGenerator:
        """Generate TTS audio frames"""
        try:
            logger.info(f"🔊 Generating TTS: {text[:50]}...")
            
            yield TTSStartedFrame()
            
            # Generate audio in thread pool (non-blocking)
            loop = asyncio.get_event_loop()
            audio_data = await loop.run_in_executor(
                None,
                self._generate_speech,
                text
            )
            
            if len(audio_data) > 0:
                # Convert to 16-bit PCM
                audio_int16 = (audio_data * 32767).astype(np.int16)
                audio_bytes = audio_int16.tobytes()
                
                frame = TTSAudioRawFrame(
                    audio=audio_bytes,
                    sample_rate=self._sample_rate,
                    num_channels=1
                )
                
                yield frame
                logger.info(f"✅ Generated {len(audio_data)/self._sample_rate:.2f}s audio")
            else:
                logger.warning("⚠️ No audio generated")
            
            yield TTSStoppedFrame()
            
        except Exception as e:
            logger.error(f"TTS error: {e}")
            yield ErrorFrame(error=f"TTS failed: {e}")
            yield TTSStoppedFrame()