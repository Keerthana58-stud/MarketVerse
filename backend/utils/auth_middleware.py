import jwt
from functools import wraps
from flask import request, jsonify
from config import Config
from bson import ObjectId

def token_required(db):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(" ")[1]
            
            if not token:
                return jsonify({'message': 'Token is missing!', 'success': False}), 401
            
            try:
                data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
                current_user = db.users.find_one({'_id': ObjectId(data['user_id'])})
                if not current_user:
                    return jsonify({'message': 'User not found!', 'success': False}), 401
            except Exception as e:
                return jsonify({'message': 'Token is invalid!', 'success': False, 'error': str(e)}), 401
            
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

def seller_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.get('role') != 'seller':
            return jsonify({'message': 'Seller access required!', 'success': False}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def buyer_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.get('role') != 'buyer':
            return jsonify({'message': 'Buyer access required!', 'success': False}), 403
        return f(current_user, *args, **kwargs)
    return decorated
