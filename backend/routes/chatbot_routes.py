from flask import Blueprint, request, jsonify
from services.gemini_service import GeminiService
from config import Config

def get_chatbot_routes(db):
    chatbot_bp = Blueprint('chatbot', __name__)
    
    # Initialize Gemini natively using environment boundaries setup in config.py
    gemini_service = GeminiService(Config.GEMINI_API_KEY)

    @chatbot_bp.route('/message', methods=['POST'])
    def handle_message():
        data = request.get_json()
        if not data or not data.get('message'):
            return jsonify({'message': 'I cannot read empty messages. Please say something!', 'success': False}), 400
            
        user_message = data.get('message')
        
        # In the future, contextual logic parsing cart numbers or orders based on JWT could go here.
        # Right now we maintain pure MarketVerse generic support functionality securely.
        
        try:
            reply = gemini_service.generate_support_reply(user_message)
            return jsonify({'reply': reply, 'success': True}), 200
        except Exception as e:
            # Mask API crashes protecting backend data
            return jsonify({'message': 'Our bot is taking a momentary break. Please try again soon!', 'success': False}), 500

    return chatbot_bp
