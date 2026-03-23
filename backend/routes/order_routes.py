from flask import Blueprint, request, jsonify
from models.order_model import OrderModel
from utils.auth_middleware import token_required, buyer_required

def get_order_routes(db):
    order_bp = Blueprint('orders', __name__)

    @order_bp.route('/place', methods=['POST'])
    @token_required(db)
    @buyer_required
    def place_order(current_user):
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Invalid request payload', 'success': False}), 400
            
        products = data.get('products')
        total_amount = data.get('total_amount')
        delivery_details = data.get('delivery_details')
        
        if not products or not total_amount or not delivery_details:
            return jsonify({'message': 'Missing required order fields', 'success': False}), 400
            
        OrderModel.create_order(
            db, 
            current_user['_id'], 
            products, 
            total_amount, 
            delivery_details
        )
        
        return jsonify({'message': 'Order placed successfully', 'success': True}), 201

    return order_bp
