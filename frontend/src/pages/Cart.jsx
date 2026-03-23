import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchCart, updateCartItem, removeFromCart } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const res = await fetchCart();
      if (res.data.success) {
        setCart(res.data.cart);
      }
    } catch (err) {
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(productId, newQuantity);
      loadCart();
    } catch (err) {
      alert('Failed to update quantity');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      loadCart();
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  
  const calculateTotal = () => {
    if (!cart || !cart.products) return 0;
    return cart.products.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  return (
    <Container>
      <h2 className="mb-4">Your Shopping Cart</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      {!cart || !cart.products || cart.products.length === 0 ? (
        <Alert variant="info" className="text-center">Your cart is empty. <br/><Button variant="link" onClick={() => navigate('/')}>Continue Shopping</Button></Alert>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm mb-4 border-0">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 ps-4">Product</th>
                      <th className="border-0">Price</th>
                      <th className="border-0">Quantity</th>
                      <th className="border-0">Total</th>
                      <th className="border-0"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.products.map(item => (
                      <tr key={item.product._id} className="align-middle">
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <img 
                              src={`http://localhost:5000${item.product.image}`} 
                              alt={item.product.item_name} 
                              style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                              className="rounded me-3"
                            />
                            <strong>{item.product.item_name}</strong>
                          </div>
                        </td>
                        <td>{formatCurrency(item.product.price)}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Button variant="outline-secondary" size="sm" onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}>-</Button>
                            <span className="mx-2">{item.quantity}</span>
                            <Button variant="outline-secondary" size="sm" onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}>+</Button>
                          </div>
                        </td>
                        <td>{formatCurrency(parseFloat(item.product.price) * item.quantity)}</td>
                        <td>
                          <Button variant="danger" size="sm" onClick={() => handleRemove(item.product._id)}>Remove</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h4 className="mb-4">Order Summary</h4>
                <div className="d-flex justify-content-between mb-3">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <strong>Total</strong>
                  <strong>{formatCurrency(calculateTotal())}</strong>
                </div>
                <Button 
                  variant="success" 
                  size="lg" 
                  className="w-100 mb-2"
                  disabled={cart.products.length === 0}
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>
                <Button variant="outline-primary" className="w-100" onClick={() => navigate('/')}>Continue Shopping</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Cart;
