import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Row, Col, Card, Badge, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchSellerProducts, deleteProduct, fetchSellerSummary, fetchSellerOrders } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [prodRes, summaryRes, ordRes] = await Promise.all([
        fetchSellerProducts(),
        fetchSellerSummary(),
        fetchSellerOrders()
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (summaryRes.data.success) setSummary(summaryRes.data.summary);
      if (ordRes.data.success) setOrders(ordRes.data.orders);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p._id !== id));
        loadDashboard(); // Reload to update summary metrics securely
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

  return (
    <Container fluid="lg">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Seller Dashboard</h2>
        <Button variant="success" onClick={() => navigate('/add-product')}>+ Add New Product</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center shadow-sm h-100 border-primary">
            <Card.Body>
              <h6 className="text-muted">Total Products</h6>
              <h3>{summary?.total_products || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center shadow-sm h-100 border-secondary">
            <Card.Body>
              <h6 className="text-muted">Total Stock Remaining</h6>
              <h3>{summary?.total_stock || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center shadow-sm h-100 border-info">
            <Card.Body>
              <h6 className="text-muted">Orders Received</h6>
              <h3>{summary?.total_orders || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center shadow-sm h-100 border-success bg-success text-white">
            <Card.Body>
              <h6>Total Revenue</h6>
              <h3>{formatCurrency(summary?.total_revenue || 0)}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="products" className="mb-4 shadow-sm" justify>
        <Tab eventKey="products" title={`My Products (${products.length})`}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Image</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Current Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4">No products found. Start adding some!</td></tr>
                  ) : (
                    products.map(product => (
                      <tr key={product._id} className="align-middle">
                        <td><img src={`http://localhost:5000${product.image}`} alt={product.item_name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }} /></td>
                        <td>{product.item_name}</td>
                        <td><Badge bg="secondary">{product.category}</Badge></td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>
                          {product.stock <= 0 ? 
                            <Badge bg="danger">Out of Stock</Badge> : 
                            <strong>{product.stock}</strong>}
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-2" onClick={() => navigate(`/edit-product/${product._id}`)}>Edit</Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(product._id)}>Delete</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="orders" title={`Sales & Orders (${orders.length})`}>
          {orders.length === 0 ? (
            <Alert variant="info" className="m-3">No orders received yet.</Alert>
          ) : (
            <Row xs={1} className="g-4 m-0 p-3">
              {orders.map(order => (
                <Col key={order._id}>
                  <Card className="shadow-sm h-100 border-0 border-start border-4 border-success">
                    <Card.Body>
                      <Row>
                        <Col md={4} className="border-end">
                          <h6 className="text-muted mb-3">Buyer Details</h6>
                          <p className="mb-1"><strong>Name:</strong> {order.buyer_name}</p>
                          <p className="mb-1"><strong>Email:</strong> {order.buyer_email}</p>
                          <p className="mb-0"><strong>Address:</strong><br/>
                            <small className="text-muted">
                              {order.delivery_details?.address}, {order.delivery_details?.city}, {order.delivery_details?.state} - {order.delivery_details?.pincode}
                            </small>
                          </p>
                        </Col>
                        <Col md={5} className="border-end">
                          <h6 className="text-muted mb-3">Order Items</h6>
                          <ul className="list-unstyled mb-0">
                            {order.products.map((p, idx) => (
                              <li key={idx} className="mb-2 d-flex justify-content-between border-bottom pb-1">
                                <span>{p.item_name} <Badge bg="secondary">x{p.quantity}</Badge></span>
                                <span>{formatCurrency(p.price)}</span>
                              </li>
                            ))}
                          </ul>
                        </Col>
                        <Col md={3} className="d-flex flex-column justify-content-center text-end">
                          <p className="mb-1 text-muted small">{new Date(order.created_at).toLocaleString()}</p>
                          <h4 className="text-success mb-2">{formatCurrency(order.total_amount)}</h4>
                          <div><Badge bg="success">PAID</Badge></div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default SellerDashboard;
