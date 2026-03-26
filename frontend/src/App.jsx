import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavigationBar from './components/NavigationBar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Catalogue from './pages/Catalogue';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import BuyerOrders from './pages/BuyerOrders';
import Chatbot from './components/Chatbot';

const HomeRedirect = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.role === 'buyer') return <Navigate to="/buyer-dashboard" replace />;
    if (user?.role === 'seller') return <Navigate to="/seller-dashboard" replace />;
  } catch (e) {
    // ignore
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <NavigationBar />
      <div className="container mt-4 pb-5">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Buyer Routes */}
          <Route 
            path="/buyer-dashboard" 
            element={
              <ProtectedRoute roleRequired="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/catalogue" 
            element={
              <ProtectedRoute>
                <Catalogue />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/product/:id" 
            element={
              <ProtectedRoute>
                <ProductDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute roleRequired="buyer">
                <Cart />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute roleRequired="buyer">
                <Checkout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/buyer-orders" 
            element={
              <ProtectedRoute roleRequired="buyer">
                <BuyerOrders />
              </ProtectedRoute>
            } 
          />

          {/* Seller Routes */}
          <Route 
            path="/seller-dashboard" 
            element={
              <ProtectedRoute roleRequired="seller">
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-product" 
            element={
              <ProtectedRoute roleRequired="seller">
                <AddProduct />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-product/:id" 
            element={
              <ProtectedRoute roleRequired="seller">
                <EditProduct />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
      <Chatbot />
    </Router>
  );
}

export default App;
