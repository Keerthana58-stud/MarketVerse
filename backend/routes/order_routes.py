from flask import Blueprint, request, jsonify
from models.order_model import OrderModel
from utils.auth_middleware import token_required, buyer_required, seller_required
from utils.redis_client import redis_cache

def get_order_routes(db):
    order_bp = Blueprint('orders', __name__)

    @order_bp.route('/place', methods=['POST'])
    @token_required(db)
    @buyer_required
    def place_order(current_user):
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Invalid request payload', 'success': False}), 400
            
        products_req = data.get('products')
        delivery_details = data.get('delivery_details')
        
        if not products_req or not delivery_details:
            return jsonify({'message': 'Missing required order fields', 'success': False}), 400
            
        try:
            OrderModel.create_order(
                db, 
                current_user['_id'], 
                current_user.get('name'),
                current_user.get('email'),
                products_req, 
                delivery_details
            )
            
            # Invalidate caches
            buyer_id = str(current_user['_id'])
            redis_cache.delete(f"buyer:summary:{buyer_id}")
            
            # Invalidate seller summaries and products
            seller_ids = set()
            for req_item in products_req:
                prod_id = req_item.get('product_id')
                product_db = db.products.find_one({"_id": str(prod_id)}) or db.products.find_one({"_id": __import__('bson').ObjectId(prod_id) if len(prod_id)==24 else prod_id})
                if product_db and 'seller_id' in product_db:
                    seller_ids.add(str(product_db['seller_id']))
                    redis_cache.delete(f"product:{prod_id}")
            
            for s_id in seller_ids:
                redis_cache.delete(f"seller:summary:{s_id}")
                redis_cache.delete(f"seller:products:{s_id}")
                
            redis_cache.delete('products:all')
            
            return jsonify({'message': 'Order placed successfully', 'success': True}), 201
        except ValueError as e:
            return jsonify({'message': str(e), 'success': False}), 400
        except Exception as e:
            return jsonify({'message': 'Failed to process order internally', 'success': False}), 500

    @order_bp.route('/buyer', methods=['GET'])
    @token_required(db)
    @buyer_required
    def get_buyer_orders(current_user):
        orders = OrderModel.get_orders_by_buyer(db, current_user['_id'])
        return jsonify({'success': True, 'orders': orders}), 200

    @order_bp.route('/seller', methods=['GET'])
    @token_required(db)
    @seller_required
    def get_seller_orders(current_user):
        orders = OrderModel.get_orders_by_seller(db, current_user['_id'])
        return jsonify({'success': True, 'orders': orders}), 200

    return order_bp
