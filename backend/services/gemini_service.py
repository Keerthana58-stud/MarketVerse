import logging
import time

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.client = None

        if not self.api_key:
            logger.warning("[CHATBOT] GEMINI_API_KEY is missing. Chatbot will not function.")
            return

        try:
            from google import genai
            from google.genai import types
            self._types = types
            self.client = genai.Client(api_key=self.api_key)

            self.system_instruction = (
                "You are the official customer support assistant for the MarketVerse marketplace application. "
                "Help users ONLY with app-related questions. Answer concisely, briefly, and clearly. "
                "Focus on MarketVerse workflows: login, registering, buyer/seller dashboards, catalogue browsing, "
                "cart management, checkout, order tracking, and stock management. "
                "If asked ANY unrelated questions, politely respond that you are only for MarketVerse support. "
                "Do NOT invent account numbers, payment specifics, or order tracking IDs unless strictly provided in context."
            )
            logger.info("[CHATBOT] Gemini service initialized successfully.")
        except ImportError as e:
            logger.error(f"[CHATBOT] google-genai package not found. Install it via pip: {e}")
            self.client = None
        except Exception as e:
            logger.error(f"[CHATBOT] Failed to initialize Gemini client: {e}")
            self.client = None

    def generate_support_reply(self, message):
        """
        Sends the user's message to Gemini model and returns the reply.
        Falls back safely on any error so the app never crashes.
        """
        if not self.client:
            logger.warning("[CHATBOT] Client not initialized. Returning fallback message.")
            return "AI service is temporarily unavailable. Please contact support or try again later."

        try:
            logger.info(f"[CHATBOT REQUEST] Sending message to Gemini: '{message[:80]}...' " if len(message) > 80 else f"[CHATBOT REQUEST] Sending: '{message}'")
            start = time.time()

            response = self.client.models.generate_content(
                model='gemini-1.5-flash',
                contents=message,
                config=self._types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    temperature=0.3
                )
            )

            elapsed = round((time.time() - start) * 1000, 2)
            reply = response.text
            logger.info(f"[CHATBOT RESPONSE] Received in {elapsed}ms. Reply length: {len(reply)} chars.")
            return reply

        except Exception as e:
            import traceback
            traceback.print_exc()   # ADD THIS
            error_str = str(e)
