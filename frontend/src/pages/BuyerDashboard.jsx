import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchBuyerSummary, fetchAllProducts } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import ProductCard from '../components/ProductCard';

const BuyerDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, productsRes] = await Promise.all([
        fetchBuyerSummary(),
        fetchAllProducts()
      ]);
      
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.summary);
      }
      
      if (productsRes.data.success) {
        // Just show 4 most recent products
        const sortedProducts = productsRes.data.products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentProducts(sortedProducts.slice(0, 4));
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Welcome back, {user?.name}!</h2>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="text-center shadow-sm h-100 border-primary bg-primary text-white">
            <Card.Body className="d-flex flex-column justify-content-center">
              <h5>Total Orders Placed</h5>
              <h2>{summary?.total_orders || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="text-center shadow-sm h-100 border-success bg-success text-white">
            <Card.Body className="d-flex flex-column justify-content-center">
              <h5>Total Amount Spent</h5>
              <h2>{formatCurrency(summary?.total_spent || 0)}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="text-center shadow-sm h-100 border-info bg-info text-white">
            <Card.Body className="d-flex flex-column justify-content-center">
              <h5>Items in Cart</h5>
              <h2>{summary?.cart_items || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="d-flex justify-content-around py-4">
              <Button variant="outline-primary" size="lg" onClick={() => navigate('/catalogue')}>Browse Catalogue</Button>
              <Button variant="outline-success" size="lg" onClick={() => navigate('/cart')}>View My Cart</Button>
              <Button variant="outline-secondary" size="lg" onClick={() => navigate('/buyer-orders')}>My Order History</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h4 className="mb-3">Recently Added Products</h4>
      {recentProducts.length === 0 ? (
        <Alert variant="info">No products available yet.</Alert>
      ) : (
        <Row xs={1} md={2} lg={4} className="g-4">
          {recentProducts.map(product => (
            <Col key={product._id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default BuyerDashboard;
