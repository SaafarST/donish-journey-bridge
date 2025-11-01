# mms_tts_tajik.py — FIXED FOR PIPECAT + MPS
import torch
import numpy as np
import asyncio
from typing import AsyncGenerator
from transformers import VitsModel, AutoTokenizer
from pipecat.services.tts_service import TTSService
from pipecat.frames.frames import AudioRawFrame, TTSStartedFrame, TTSStoppedFrame, ErrorFrame, TTSAudioRawFrame
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
import logging

logger = logging.getLogger(__name__)

class MMSTTSTajik(TTSService):
    def __init__(self, model_path: str, **kwargs):
        super().__init__(**kwargs)
        
        # M1 Mac optimized settings
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        
        self._model_path = model_path
        self._sample_rate = 16000
        
        self._load_models()
    
    def _load_models(self):
        """Load models optimized for M1"""
        try:
            logger.info(f"Loading MMS model from local path: {self._model_path}")
            
            # Load tokenizer from local path
            self.tokenizer = AutoTokenizer.from_pretrained(
                self._model_path,
                local_files_only=True
            )
            
            # Load model from local path
            self.model = VitsModel.from_pretrained(
                self._model_path,
                torch_dtype=torch.float32,  # Use float32 for stability on MPS
                local_files_only=True
            )
            self.model.eval()
            self.model.to(self.device)
            
            logger.info("✅ Models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            raise
    
    def _prepare_text(self, text: str) -> str:
        """Prepare text for MMS TTS"""
        text = text.strip()
        text = text.replace('"', '')
        text = text.replace("'", '')
        if not text:
            text = "."
        return text
    
    def _generate_speech(self, text: str) -> np.ndarray:
        """Generate speech from text using MMS — FIXED MPS DTYPE ISSUE"""
        try:
            text = self._prepare_text(text)
            
            # Tokenize text
            inputs = self.tokenizer(text, return_tensors="pt")
            
            # 🔥 CRITICAL FIX: Cast input_ids to long() for MPS compatibility
            inputs = {k: v.long().to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                output = self.model(**inputs).waveform
            
            audio_array = output.squeeze().cpu().numpy()
            audio_array = np.clip(audio_array, -1.0, 1.0)
            
            return audio_array.astype(np.float32)
            
        except Exception as e:
            logger.error(f"Speech generation error: {e}")
            return np.zeros(self._sample_rate, dtype=np.float32)
    
    async def run_tts(self, text: str) -> AsyncGenerator:
        """Run TTS generation — FIXED: Removed 'pts' (not supported in your Pipecat version)"""
        try:
            logger.info(f"Generating TTS for: {text[:50]}...")
            
            # Yield start frame
            yield TTSStartedFrame()
            
            # Generate audio
            audio_data = self._generate_speech(text)
            
            # Convert to frame if we have audio
            if len(audio_data) > 0:
                # Convert to 16-bit PCM for WebRTC
                audio_int16 = (audio_data * 32767).astype(np.int16)
                audio_bytes = audio_int16.tobytes()
                
                
                # ✅ CORRECT - Use TTSAudioRawFrame which inherits from Frame
                frame = TTSAudioRawFrame(
                    audio=audio_bytes,
                    sample_rate=self._sample_rate,
                    num_channels=1
                )
                
                yield frame
                logger.info(f"✅ Generated {len(audio_data)/self._sample_rate:.2f}s of audio")
            else:
                logger.warning("No audio generated")
            
            # Yield stop frame
            yield TTSStoppedFrame()
            
        except Exception as e:
            logger.error(f"TTS error: {e}")
            yield ErrorFrame(error=f"TTS failed: {e}")
            yield TTSStoppedFrame()