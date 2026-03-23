import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (userData) => api.post('/auth/login', userData);
export const getMe = () => api.get('/auth/me');

// Product APIs
export const fetchAllProducts = () => api.get('/products/all');
export const fetchSellerProducts = () => api.get('/products/seller');
export const fetchProductById = (id) => api.get(`/products/${id}`);
export const addProduct = (formData) => api.post('/products/add', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const updateProduct = (id, formData) => api.put(`/products/update/${id}`, formData);
export const deleteProduct = (id) => api.delete(`/products/delete/${id}`);

// Cart APIs
export const fetchCart = () => api.get('/cart/');
export const addToCart = (productId, quantity = 1) => api.post('/cart/add', { product_id: productId, quantity });
export const updateCartItem = (productId, quantity) => api.put('/cart/update', { product_id: productId, quantity });
export const removeFromCart = (productId) => api.delete(`/cart/remove/${productId}`);

// Order APIs
export const placeOrder = (orderData) => api.post('/orders/place', orderData);

export default api;
