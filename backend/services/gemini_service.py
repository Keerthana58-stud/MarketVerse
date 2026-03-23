import os
from google import genai
from google.genai import types

class GeminiService:
    def __init__(self, api_key):
        self.api_key = api_key
        if self.api_key:
            # The new google.genai initializes a client directly instead of configuring global state
            self.client = genai.Client(api_key=self.api_key)
            
            # Define strict System Instructions ensuring domain lockdown.
            self.system_instruction = (
                "You are the official customer support assistant for the MarketVerse marketplace application. "
                "Help users ONLY with app-related questions. Answer concisely, briefly, and clearly. "
                "Focus on MarketVerse workflows: login, registering, buyer/seller dashboards, catalogue browsing, "
                "cart management, checkout, order tracking, and stock management. "
                "If asked ANY unrelated questions, politely respond that you are only for MarketVerse support. "
                "Do NOT invent account numbers, payment specifics, or order tracking IDs unless strictly provided in context."
            )
        else:
            self.client = None

    def generate_support_reply(self, message):
        """
        Sends the user's message to the configured Gemini model securely.
        """
        if not self.client:
            return "Server Error: GEMINI_API_KEY is missing or invalid. Please inform the administrator."
            
        try:
            # We use gemini-2.5-flash as the new standard API offering natively supporting system instructions
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=message,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    temperature=0.3
                )
            )
            return response.text
        except Exception as e:
            print("GEMINI API ERROR:", e)
            # Mask the actual backend crash strictly returning a nice message
            return f"I am currently experiencing technical difficulties processing your request. Please try again later."
