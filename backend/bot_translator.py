import argparse
import asyncio
import os
import sys
from contextlib import asynccontextmanager
from typing import Dict

# Add local pipecat to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "pipecat", "src"))

import uvicorn
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from loguru import logger

# ✅ USE REAL PIPECAT SMART TURN V3
from pipecat.audio.turn.smart_turn.local_smart_turn_v3 import LocalSmartTurnAnalyzerV3
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.frames.frames import (
    Frame, 
    TranscriptionFrame, 
    LLMContextFrame, 
    TextFrame,
    LLMFullResponseStartFrame,
    LLMFullResponseEndFrame,
    TTSSpeakFrame
)
import re

# 🌏 MULTILINGUAL STT (Your working model)
from pipecat.services.whisper.stt import WhisperSTTServiceMLX, MLXModel

# 🇹🇯 TAJIK TTS (Your existing)
from mms_tts_tajik import MMSTTSTajik

from pipecat.transports.base_transport import TransportParams
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIObserver, RTVIProcessor
from pipecat.transports.network.small_webrtc import SmallWebRTCTransport
from pipecat.transports.network.webrtc_connection import IceServer, SmallWebRTCConnection

load_dotenv(override=True)

app = FastAPI()

pcs_map: Dict[str, SmallWebRTCConnection] = {}

ice_servers = [
    IceServer(
        urls="stun:stun.l.google.com:19302",
    )
]

# 🎯 FINAL UNIVERSAL TRANSLATION PROMPT
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

---

**CORRECT EXAMPLES:**

**English:**
Input: "I need to reschedule my appointment for tomorrow."
Output: Ман бояд вохӯрии худро барои фардо ба вақти дигар гузорам.

**Russian:**
Input: "Во сколько начинается встреча?"
Output: Вохӯрӣ соати чанд сар мешавад?

**Chinese:**
Input: "这个多少钱？"
Output: Ин чанд пул аст?

**Spanish:**
Input: "Necesito ayuda, por favor."
Output: Ба ман кӯмак лозим аст, лутфан.

**German (Formal):**
Input: "Könnten Sie mir bitte den Weg zum Bahnhof zeigen?"
Output: Метавонед лутфан ба ман роҳи истгоҳро нишон диҳед?

**Arabic:**
Input: "شكرا جزيلا"
Output: Ташаккури зиёд.

**English (Informal Slang):**
Input: "That's awesome!"
Output: Ин олӣ аст!

**Multi-sentence:**
Input: "Good morning. I'm here to see Dr. Smith. Is he available?"
Output: Субҳ ба хайр. Ман барои вохӯрӣ бо доктор Смит омадаам. Оё ӯ дар ҷо аст?

**Already Tajik:**
Input: "Ин як ҷумлаи тоҷикӣ аст."
Output: Ин як ҷумлаи тоҷикӣ аст.

---

**INCORRECT EXAMPLES (NEVER DO THIS):**

Input: "Где здесь аптека?"
Wrong: Тарҷума аз русӣ: Дар ин ҷо дорухона дар куҷост? ❌
Correct: Дар ин ҷо дорухона дар куҷост?

Input: "Hello?"
Wrong: Салом! Ман туро мешунавам, ту ҷастухез намекунӣ. ❌
Correct: Салом?

Input: "He will arrive soon."
Wrong: Ӯ зуд мерасад (дар тавзеҳот омадааст: дар роҳ аст) ❌
Correct: Ӯ зуд мерасад.

Input: "Do you hear me?"
Wrong: <think>This is a question</think> Оё шумо маро мешунавед? ❌
Correct: Оё шумо маро мешунавед?

Input: "Can I speak with Mr. John?"
Wrong: Оё ман бо ҷаноби Ҷон гап зада метавонам? - Падар (ба писар) ❌
Correct: Оё ман бо ҷаноби Ҷон гап зада метавонам?

---

**FINAL INSTRUCTION:**
Your entire response must consist ONLY of the Tajik translation. Nothing else."""


def clean_translation_output(text: str) -> str:
    """🧹 AGGRESSIVE CLEANING - Remove ALL non-translation content"""
    if not text:
        return ""
    
    # Remove thinking tags
    text = re.sub(r'<think[^>]*>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'</?think[^>]*>', '', text, flags=re.IGNORECASE)
    
    # Remove common prefixes/labels
    text = re.sub(r'^(Translation:|Output:|Тарҷума:|Text:|Input:|Wrong:|Correct:)\s*', '', text, flags=re.IGNORECASE)
    
    # Remove parenthetical explanations
    text = re.sub(r'\([^)]*тавзеҳот[^)]*\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\([^)]*омадааст[^)]*\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*-\s*Падар.*$', '', text, flags=re.IGNORECASE)  # Remove dialogue attribution
    
    # Remove extra explanatory phrases
    text = re.sub(r'Ман туро мешунавам[^.]*\.', '', text, flags=re.IGNORECASE)
    text = re.sub(r'(буданаш маълум шуд|дар рӯшноӣ)', '', text, flags=re.IGNORECASE)
    
    # Clean whitespace and punctuation
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+([,.!?])', r'\1', text)  # Fix spacing before punctuation
    text = text.strip()
    
    logger.info(f"🧹 Cleaned: '{text}'")
    return text


class TranslationAggregator(FrameProcessor):
    """
    Aggregates all text frames from LLM response into one complete translation,
    then sends it as a single frame to TTS.
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_text = ""
        self.collecting = False
        
    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        
        if isinstance(frame, LLMFullResponseStartFrame):
            # Start collecting text
            self.current_text = ""
            self.collecting = True
            logger.info("📄 Started collecting LLM response...")
            
        elif isinstance(frame, TextFrame) and self.collecting:
            # Accumulate text from LLM
            self.current_text += frame.text
            logger.info(f"📝 Accumulated: '{frame.text}' (total: {len(self.current_text)} chars)")
            # Don't pass individual frames to TTS yet
            
        elif isinstance(frame, LLMFullResponseEndFrame):
            # LLM finished - clean and send complete translation
            self.collecting = False
            
            if self.current_text.strip():
                cleaned_text = clean_translation_output(self.current_text)
                
                if cleaned_text:
                    logger.info(f"✅ Complete translation: '{cleaned_text}'")
                    
                    # Send complete translation as TTSSpeakFrame
                    await self.push_frame(TTSSpeakFrame(text=cleaned_text), direction)
                else:
                    logger.warning("⚠️ Empty translation after cleaning")
            else:
                logger.warning("⚠️ No text collected from LLM")
                
            # Reset for next translation
            self.current_text = ""
            
        elif not isinstance(frame, TextFrame):
            # Pass through all non-text frames normally
            await self.push_frame(frame, direction)


class StatelessTranslationProcessor(FrameProcessor):
    """
    🧠 MEMORY-ENABLED: Accumulates user speech before translating.
    Waits for user to stop speaking, then translates complete text.
    """
    
    def __init__(self, llm_service: OpenAILLMService, **kwargs):
        super().__init__(**kwargs)
        self.llm = llm_service
        
        # 🧠 MEMORY: Accumulate user's speech
        self.speech_buffer = []
        self.last_transcription_time = None
        self.translation_task = None
        self.pause_threshold = 1.5  # Wait 1.5 seconds of silence before translating
        
    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        
        if isinstance(frame, TranscriptionFrame):
            user_text = frame.text.strip()
            if not user_text:
                return
            
            # 📝 Add to speech buffer
            self.speech_buffer.append(user_text)
            self.last_transcription_time = asyncio.get_event_loop().time()
            
            logger.info(f"📝 Buffered: '{user_text}' (total segments: {len(self.speech_buffer)})")
            
            # Cancel previous translation task if still waiting
            if self.translation_task and not self.translation_task.done():
                self.translation_task.cancel()
            
            # Schedule translation after pause
            self.translation_task = asyncio.create_task(
                self._wait_and_translate(direction)
            )
            
        else:
            # Pass through all other frames
            await self.push_frame(frame, direction)
    
    async def _wait_and_translate(self, direction: FrameDirection):
        """Wait for pause, then translate accumulated speech"""
        try:
            await asyncio.sleep(self.pause_threshold)
            
            # Check if we still have the latest transcription
            current_time = asyncio.get_event_loop().time()
            if current_time - self.last_transcription_time >= self.pause_threshold:
                await self._translate_buffer(direction)
                
        except asyncio.CancelledError:
            # New speech arrived, this task is cancelled
            pass
    
    async def _translate_buffer(self, direction: FrameDirection):
        """Translate all accumulated speech as one text"""
        if not self.speech_buffer:
            return
        
        # 🎯 Combine all speech segments with spaces
        complete_text = " ".join(self.speech_buffer).strip()
        
        logger.info(f"🎯 TRANSLATING COMPLETE SPEECH: '{complete_text}'")
        logger.info(f"📊 Total segments combined: {len(self.speech_buffer)}")
        
        # Clear buffer
        self.speech_buffer = []
        
        # Create fresh context with complete text
        fresh_context = OpenAILLMContext([
            {"role": "system", "content": TRANSLATOR_SYSTEM_PROMPT},
            {"role": "user", "content": complete_text}
        ])
        
        # Send to LLM
        await self.push_frame(LLMContextFrame(context=fresh_context), direction)


async def run_bot(webrtc_connection):
    transport = SmallWebRTCTransport(
        webrtc_connection=webrtc_connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            
            # ✅ Smart Turn v3 requires VAD with 0.2 seconds
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.2)),
            turn_analyzer=LocalSmartTurnAnalyzerV3(),
        ),
    )

    # 🌏 MULTILINGUAL STT - Fixed to transcribe (not translate)
    stt = WhisperSTTServiceMLX(
        model=MLXModel.LARGE_V3_TURBO_Q4,
        language=None  # Auto-detect language, don't force English
    )

    # 🇹🇯 TAJIK TTS - Your existing model
    tts = MMSTTSTajik(
        model_path="/Users/tohirsaidzoda/voice-agent-workspace/models/mms-tts-tgk"
    )

    # 📄 TRANSLATION LLM - Optimized settings
    llm = OpenAILLMService(
        api_key="dummyKey",
        model="ameena_qwen3-8b",
        base_url="http://10.85.58.171:1234/v1",
        max_tokens=150,  # Shorter - translations shouldn't be long
        extra_body={
            "stop": ["<think>", "</think>", "\n\n", "Input:", "Wrong:", "Correct:"],  # Stop on prompt leakage
            "temperature": 0.05,  # Even lower - be more deterministic
            "top_p": 0.85,  # More focused
            "frequency_penalty": 0.3,  # Discourage repetition
            "presence_penalty": 0.2,  # Discourage adding extra content
            "response_format": "text"
        }
    )

    # 📄 MEMORY-ENABLED TRANSLATION PROCESSOR
    translation_processor = StatelessTranslationProcessor(llm)
    
    # 📚 TRANSLATION AGGREGATOR - Collects complete LLM response
    translation_aggregator = TranslationAggregator()

    rtvi = RTVIProcessor(config=RTVIConfig(config=[]))

    pipeline = Pipeline([
        transport.input(),           # Audio input from user
        stt,                        # 🌏 Whisper STT (any language → text)
        rtvi,
        translation_processor,      # 🧠 Memory-enabled: accumulates speech
        llm,                        # 📄 LLM translates text to Tajik
        translation_aggregator,     # 📚 Collects complete translation
        tts,                        # 🇹🇯 Tajik TTS (Tajik text → audio)
        transport.output(),
    ])

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        observers=[RTVIObserver(rtvi)],
    )

    @rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        await rtvi.set_bot_ready()
        logger.info("🎯 PRODUCTION Translation bot ready!")

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"👤 Translator ready for: {participant}")
        await transport.capture_participant_transcription(participant["id"])

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"👋 Translation session ended: {participant}")
        await task.cancel()

    runner = PipelineRunner(handle_sigint=False)
    await runner.run(task)


@app.post("/api/offer")
async def offer(request: dict, background_tasks: BackgroundTasks):
    pc_id = request.get("pc_id")

    if pc_id and pc_id in pcs_map:
        pipecat_connection = pcs_map[pc_id]
        logger.info(f"🔄 Reusing translator connection: {pc_id}")
        await pipecat_connection.renegotiate(
            sdp=request["sdp"],
            type=request["type"],
            restart_pc=request.get("restart_pc", False),
        )
    else:
        pipecat_connection = SmallWebRTCConnection(ice_servers)
        await pipecat_connection.initialize(sdp=request["sdp"], type=request["type"])

        @pipecat_connection.event_handler("closed")
        async def handle_disconnected(webrtc_connection: SmallWebRTCConnection):
            logger.info(f"🔌 Translator disconnected: {webrtc_connection.pc_id}")
            pcs_map.pop(webrtc_connection.pc_id, None)

        background_tasks.add_task(run_bot, pipecat_connection)

    answer = pipecat_connection.get_answer()
    pcs_map[answer["pc_id"]] = pipecat_connection
    return answer


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    coros = [pc.disconnect() for pc in pcs_map.values()]
    await asyncio.gather(*coros)
    pcs_map.clear()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="🎯 PRODUCTION Voice Translator: Any Language → Tajik")
    parser.add_argument("--host", default="localhost", help="Host (default: localhost)")
    parser.add_argument("--port", type=int, default=7860, help="Port (default: 7860)")
    args = parser.parse_args()

    logger.info("🎯 Starting PRODUCTION Voice Translator")
    logger.info("🧠 NEW: Memory-enabled - accumulates complete speech")
    logger.info("🧹 NEW: Aggressive cleaning removes all junk")
    logger.info("🌏 NEW: Fixed Whisper to transcribe (not translate)")
    logger.info("🎯 NEW: Optimized prompt prevents conversational responses")
    logger.info("✅ Ready for tomorrow's demo!")
    uvicorn.run(app, host=args.host, port=args.port)