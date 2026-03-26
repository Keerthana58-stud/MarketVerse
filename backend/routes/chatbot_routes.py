import logging
from flask import Blueprint, request, jsonify
from services.gemini_service import GeminiService
from config import Config

logger = logging.getLogger(__name__)

def get_chatbot_routes(db):
    chatbot_bp = Blueprint('chatbot', __name__)

    gemini_service = GeminiService(Config.GEMINI_API_KEY)

    @chatbot_bp.route('/message', methods=['POST'])
    def handle_message():
        data = request.get_json()
        if not data or not data.get('message'):
            return jsonify({'reply': 'Please say something so I can help you!', 'success': False}), 400

        user_message = data.get('message', '').strip()
        logger.info(f"[CHATBOT ROUTE] Received user message ({len(user_message)} chars).")

        try:
            reply = gemini_service.generate_support_reply(user_message)
            return jsonify({'reply': reply, 'success': True}), 200
        except Exception as e:
            logger.error(f"[CHATBOT ROUTE ERROR] Unexpected error in handle_message: {e}")
            return jsonify({
                'reply': 'AI service is temporarily unavailable. Please try again shortly.',
                'success': False
            }), 500

    return chatbot_bp
