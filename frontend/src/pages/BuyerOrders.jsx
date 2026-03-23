import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import { fetchBuyerOrders } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await fetchBuyerOrders();
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      setError('Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

  return (
    <Container>
      <h2 className="mb-4">My Order History</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}

      {orders.length === 0 && !error ? (
        <Alert variant="info">You haven't placed any orders yet.</Alert>
      ) : (
        orders.map((order) => (
          <Card key={order._id} className="mb-4 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-light">
              <div>
                <strong>Order ID:</strong> {order._id}<br />
                <small className="text-muted">Placed on {new Date(order.created_at).toLocaleString()}</small>
              </div>
              <div className="text-end">
                <Badge bg={order.order_status === 'placed' ? 'success' : 'secondary'} className="mb-1">
                  {order.order_status.toUpperCase()}
                </Badge><br/>
                <strong>Total: {formatCurrency(order.total_amount)}</strong>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive borderless className="mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.products.map((item, idx) => (
                    <tr key={idx} className="border-bottom">
                      <td>
                        <div className="d-flex align-items-center">
                          {item.image && <img src={`http://localhost:5000${item.image}`} alt={item.item_name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }} />}
                          {item.item_name}
                        </div>
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default BuyerOrders;
