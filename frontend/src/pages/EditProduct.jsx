import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductById, updateProduct } from '../services/api';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    item_name: '',
    price: '',
    stock: '',
    description: '',
    category: ''
  });
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await fetchProductById(id);
      if (res.data.success) {
        const product = res.data.product;
        setFormData({
          item_name: product.item_name,
          price: product.price,
          stock: product.stock || 0,
          description: product.description,
          category: product.category
        });
        setCurrentImage(product.image);
      }
    } catch (err) {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('item_name', formData.item_name);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    data.append('description', formData.description);
    data.append('category', formData.category);
    
    if (image) {
      data.append('image', image);
    }

    try {
      const res = await updateProduct(id, data);
      if (res.data.success) {
        navigate('/seller-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={8}>
          <Card className="shadow pb-4">
            <Card.Body className="p-4">
              <h2 className="mb-4">Edit Product</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Name</Form.Label>
                  <Form.Control type="text" name="item_name" value={formData.item_name} required onChange={handleChange} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Price (₹)</Form.Label>
                  <Form.Control type="number" step="0.01" name="price" value={formData.price} required onChange={handleChange} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Available Stock</Form.Label>
                  <Form.Control type="number" name="stock" min="0" value={formData.stock} required onChange={handleChange} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select name="category" value={formData.category} required onChange={handleChange}>
                    <option value="" disabled>Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home">Home</option>
                    <option value="Toys">Toys</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={formData.description} required onChange={handleChange} />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Product Image (Optional to update)</Form.Label>
                  {currentImage && (
                    <div className="mb-2">
                       <img src={`http://localhost:5000${currentImage}`} alt="Current" style={{ width: '100px', borderRadius: '5px' }} />
                    </div>
                  )}
                  <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => navigate('/seller-dashboard')}>Cancel</Button>
                  <Button variant="primary" type="submit">Update Product</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditProduct;
