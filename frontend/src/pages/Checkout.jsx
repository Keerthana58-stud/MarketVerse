import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchCart, placeOrder } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const res = await fetchCart();
      if (res.data.success) {
        if (!res.data.cart.products || res.data.cart.products.length === 0) {
          navigate('/cart');
          return;
        }
        setCart(res.data.cart);
      }
    } catch (err) {
      setError('Failed to load cart details for checkout.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.products) return 0;
    return cart.products.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  const handleChange = (e) => {
    setDeliveryDetails({ ...deliveryDetails, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart || cart.products.length === 0) {
      setError('Your cart is empty. Please add items to order.');
      return;
    }
    
    // Check if any field is empty
    const isFormValid = Object.values(deliveryDetails).every(val => val.trim() !== '');
    if (!isFormValid) {
      setError('Please fill all delivery details fields.');
      return;
    }

    try {
      setPlacingOrder(true);
      setError('');
      
      const payload = {
        products: cart.products.map(item => ({
          product_id: item.product._id,
          product_name: item.product.item_name,
          quantity: item.quantity,
          price: item.product.price
        })),
        total_amount: calculateTotal(),
        delivery_details: deliveryDetails
      };

      const res = await placeOrder(payload);
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/buyer-dashboard');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

  if (success) {
    return (
      <Container className="mt-5">
        <Alert variant="success" className="text-center p-5 shadow-sm">
          <h3>Order placed successfully!</h3>
          <p>Thank you for shopping with MarketVerse. Redirecting to your dashboard...</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="mb-4">Checkout</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={7}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h4 className="mb-3">Delivery Details</h4>
              <Form onSubmit={handlePlaceOrder}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control type="text" name="fullName" required value={deliveryDetails.fullName} onChange={handleChange} />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control type="tel" name="phone" required value={deliveryDetails.phone} onChange={handleChange} />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control as="textarea" rows={2} name="address" required value={deliveryDetails.address} onChange={handleChange} />
                </Form.Group>
                
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control type="text" name="city" required value={deliveryDetails.city} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control type="text" name="state" required value={deliveryDetails.state} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Pincode</Form.Label>
                      <Form.Control type="text" name="pincode" required value={deliveryDetails.pincode} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="success" size="lg" type="submit" className="w-100 mt-2" disabled={placingOrder}>
                  {placingOrder ? <Spinner animation="border" size="sm" /> : 'Place Order'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={5}>
          <Card className="shadow-sm bg-light">
            <Card.Body>
              <h4 className="mb-4">Order Summary</h4>
              {cart?.products?.map((item, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <strong>{item.product.item_name}</strong>
                    <div className="text-muted small">Qty: {item.quantity}</div>
                  </div>
                  <span>{formatCurrency(parseFloat(item.product.price) * item.quantity)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
                <h5 className="mb-0">Total Amount</h5>
                <h4 className="text-success mb-0">{formatCurrency(calculateTotal())}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;
