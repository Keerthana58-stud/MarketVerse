import jwt
import datetime
from flask import Blueprint, request, jsonify
from models.user_model import UserModel
from config import Config
from utils.auth_middleware import token_required
from bson import ObjectId

def get_auth_routes(db):
    auth_bp = Blueprint('auth', __name__)

    @auth_bp.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password') or not data.get('name') or not data.get('role'):
            return jsonify({'message': 'Missing fields', 'success': False}), 400
        
        if data.get('role') not in ['buyer', 'seller']:
            return jsonify({'message': 'Invalid role', 'success': False}), 400

        existing_user = UserModel.get_user_by_email(db, data['email'])
        if existing_user:
            return jsonify({'message': 'Email already registered', 'success': False}), 400

        UserModel.create_user(db, data['name'], data['email'], data['password'], data['role'])
        return jsonify({'message': 'User registered successfully', 'success': True}), 201

    @auth_bp.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Missing email or password', 'success': False}), 400

        user = UserModel.get_user_by_email(db, data['email'])
        if not user or not UserModel.verify_password(data['password'], user['password']):
            return jsonify({'message': 'Invalid credentials', 'success': False}), 401

        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, Config.SECRET_KEY, algorithm="HS256")

        return jsonify({
            'message': 'Login successful',
            'success': True,
            'token': token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200

    @auth_bp.route('/me', methods=['GET'])
    @token_required(db)
    def get_me(current_user):
        return jsonify({
            'success': True,
            'user': {
                'id': str(current_user['_id']),
                'name': current_user['name'],
                'email': current_user['email'],
                'role': current_user['role']
            }
        }), 200

    return auth_bp
