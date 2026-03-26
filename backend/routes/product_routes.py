import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from models.product_model import ProductModel
from utils.auth_middleware import token_required, seller_required
from config import Config
from bson import ObjectId
from utils.redis_client import redis_cache
import time
import logging

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_product_routes(db):
    product_bp = Blueprint('products', __name__)

    @product_bp.route('/add', methods=['POST'])
    @token_required(db)
    @seller_required
    def add_product(current_user):
        # Handle file upload
        if 'image' not in request.files:
            return jsonify({'message': 'No image provided', 'success': False}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'message': 'No selected file', 'success': False}), 400

        if not allowed_file(file.filename):
            return jsonify({'message': 'Invalid file type', 'success': False}), 400

        # Create uploads dir if it doesn't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        filename = secure_filename(file.filename)
        # Add timestamp to ensure uniqueness
        from datetime import datetime
        filename = f"{datetime.now().strftime('%Y%md%H%M%S')}_{filename}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Handle form data
        item_name = request.form.get('item_name')
        price = request.form.get('price')
        description = request.form.get('description')
        category = request.form.get('category')
        stock = request.form.get('stock')

        if not all([item_name, price, description, category, stock is not None]):
            return jsonify({'message': 'Missing product details', 'success': False}), 400

        ProductModel.create_product(
            db, 
            current_user['_id'], 
            item_name, 
            f"/static/uploads/{filename}", 
            price, 
            description, 
            category,
            stock
        )
        # Invalidate related caches
        redis_cache.delete('products:all')
        redis_cache.delete(f"seller:products:{current_user['_id']}")
        redis_cache.delete(f"seller:summary:{current_user['_id']}")

        return jsonify({'message': 'Product added successfully', 'success': True}), 201

    @product_bp.route('/all', methods=['GET'])
    def get_all_products():
        start_time = time.time()
        cache_key = 'products:all'
        cached_products = redis_cache.get(cache_key)
        
        if cached_products:
            time_taken = round((time.time() - start_time) * 1000, 2)
            logger.info(f"[CACHE HIT] {cache_key} ({time_taken}ms)")
            return jsonify({'success': True, 'products': cached_products, 'source': 'redis', 'time_ms': time_taken}), 200

        logger.info(f"[CACHE MISS] {cache_key} -> fetching from DB")
        products = ProductModel.get_all_products(db)
        for p in products:
            p['_id'] = str(p['_id'])
            p['seller_id'] = str(p['seller_id'])
            if 'created_at' in p:
                p['created_at'] = str(p['created_at'])
            # fetch seller info (optional but useful)
            seller = db.users.find_one({"_id": ObjectId(p['seller_id'])})
            if seller:
                p['seller_name'] = seller.get('name')
                
        # Cache for 1 hour
        redis_cache.set(cache_key, products, ex=3600)
        logger.info(f"[CACHE SET] {cache_key}")
        
        time_taken = round((time.time() - start_time) * 1000, 2)
        logger.info(f"[DB FETCH] {cache_key} completed in {time_taken}ms")
        return jsonify({'success': True, 'products': products, 'source': 'database', 'time_ms': time_taken}), 200

    @product_bp.route('/seller', methods=['GET'])
    @token_required(db)
    @seller_required
    def get_seller_products(current_user):
        start_time = time.time()
        seller_id = str(current_user['_id'])
        cache_key = f"seller:products:{seller_id}"
        cached_products = redis_cache.get(cache_key)
        
        if cached_products:
            time_taken = round((time.time() - start_time) * 1000, 2)
            logger.info(f"[CACHE HIT] {cache_key} ({time_taken}ms)")
            return jsonify({'success': True, 'products': cached_products, 'source': 'redis', 'time_ms': time_taken}), 200

        logger.info(f"[CACHE MISS] {cache_key} -> fetching from DB")
        products = ProductModel.get_products_by_seller(db, current_user['_id'])
        for p in products:
            p['_id'] = str(p['_id'])
            p['seller_id'] = str(p['seller_id'])
            if 'created_at' in p:
                p['created_at'] = str(p['created_at'])
                
        redis_cache.set(cache_key, products, ex=1800) # 30 mins
        logger.info(f"[CACHE SET] {cache_key}")
        
        time_taken = round((time.time() - start_time) * 1000, 2)
        logger.info(f"[DB FETCH] {cache_key} completed in {time_taken}ms")
        return jsonify({'success': True, 'products': products, 'source': 'database', 'time_ms': time_taken}), 200
        
    @product_bp.route('/<id>', methods=['GET'])
    def get_product_by_id(id):
        start_time = time.time()
        cache_key = f"product:{id}"
        cached_product = redis_cache.get(cache_key)
        
        if cached_product:
            time_taken = round((time.time() - start_time) * 1000, 2)
            logger.info(f"[CACHE HIT] {cache_key} ({time_taken}ms)")
            return jsonify({'success': True, 'product': cached_product, 'source': 'redis', 'time_ms': time_taken}), 200

        logger.info(f"[CACHE MISS] {cache_key} -> fetching from DB")
        product = ProductModel.get_product_by_id(db, id)
        if not product:
            return jsonify({'message': 'Product not found', 'success': False}), 404
        product['_id'] = str(product['_id'])
        product['seller_id'] = str(product['seller_id'])
        if 'created_at' in product:
            product['created_at'] = str(product['created_at'])
        seller = db.users.find_one({"_id": ObjectId(product['seller_id'])})
        if seller:
            product['seller_name'] = seller.get('name')
            
        redis_cache.set(cache_key, product, ex=3600)
        logger.info(f"[CACHE SET] {cache_key}")
        
        time_taken = round((time.time() - start_time) * 1000, 2)
        logger.info(f"[DB FETCH] {cache_key} completed in {time_taken}ms")
        return jsonify({'success': True, 'product': product, 'source': 'database', 'time_ms': time_taken}), 200

    @product_bp.route('/update/<id>', methods=['PUT'])
    @token_required(db)
    @seller_required
    def update_product(current_user, id):
        product = ProductModel.get_product_by_id(db, id)
        if not product or product['seller_id'] != str(current_user['_id']):
            return jsonify({'message': 'Unauthorized or Not Found', 'success': False}), 404
            
        # Get everything from either form or json
        data = request.form.to_dict() or request.get_json() or {}
        
        # Check if an image is provided in the update
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                from datetime import datetime
                filename = f"{datetime.now().strftime('%Y%md%H%M%S')}_{filename}"
                filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
                file.save(filepath)
                data['image'] = f"/static/uploads/{filename}"
                
        if 'price' in data:
            data['price'] = float(data['price'])
        if 'stock' in data:
            data['stock'] = int(data['stock'])
            
        ProductModel.update_product(db, id, current_user['_id'], data)
        
        # Invalidate related caches
        redis_cache.delete('products:all')
        redis_cache.delete(f"product:{id}")
        redis_cache.delete(f"seller:products:{current_user['_id']}")
        
        return jsonify({'message': 'Product updated successfully', 'success': True}), 200

    @product_bp.route('/delete/<id>', methods=['DELETE'])
    @token_required(db)
    @seller_required
    def delete_product(current_user, id):
        result = ProductModel.delete_product(db, id, current_user['_id'])
        if result.deleted_count == 0:
            return jsonify({'message': 'Unauthorized or Not Found', 'success': False}), 404
            
        # Invalidate caches
        redis_cache.delete('products:all')
        redis_cache.delete(f"product:{id}")
        redis_cache.delete(f"seller:products:{current_user['_id']}")
        redis_cache.delete(f"seller:summary:{current_user['_id']}")
        
        return jsonify({'message': 'Product deleted successfully', 'success': True}), 200

    return product_bp
