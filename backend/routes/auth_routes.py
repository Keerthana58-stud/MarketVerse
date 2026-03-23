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

    @auth_bp.route('/buyer-summary', methods=['GET'])
    @token_required(db)
    def buyer_summary(current_user):
        if current_user.get('role') != 'buyer':
            return jsonify({'message': 'Unauthorized', 'success': False}), 403
            
        cart = db.carts.find_one({"buyer_id": str(current_user['_id'])})
        cart_items_count = len(cart.get('products', [])) if cart else 0
        
        orders = list(db.orders.find({"buyer_id": str(current_user['_id'])}))
        total_orders = len(orders)
        total_spent = sum(float(o.get('total_amount', 0.0)) for o in orders)
        
        return jsonify({'success': True, 'summary': {'cart_items': cart_items_count, 'total_orders': total_orders, 'total_spent': total_spent}}), 200

    @auth_bp.route('/seller-summary', methods=['GET'])
    @token_required(db)
    def seller_summary(current_user):
        if current_user.get('role') != 'seller':
            return jsonify({'message': 'Unauthorized', 'success': False}), 403
            
        products = list(db.products.find({"seller_id": str(current_user['_id'])}))
        total_products = len(products)
        total_stock = sum(int(p.get('stock', 0)) for p in products)
        
        seller_id_str = str(current_user['_id'])
        relevant_orders = list(db.orders.find({"products.seller_id": seller_id_str}))
        
        total_orders = len(relevant_orders) 
        total_revenue = 0.0
        
        for o in relevant_orders:
            for p in o.get('products', []):
                if p.get('seller_id') == seller_id_str:
                    total_revenue += float(p.get('price', 0)) * int(p.get('quantity', 1))
                    
        return jsonify({'success': True, 'summary': {'total_products': total_products, 'total_stock': total_stock, 'total_orders': total_orders, 'total_revenue': total_revenue}}), 200

    return auth_bp
