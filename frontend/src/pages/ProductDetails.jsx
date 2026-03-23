import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById, fetchAllProducts, addToCart } from '../services/api';
import ProductCard from '../components/ProductCard';
import { formatCurrency } from '../utils/formatCurrency';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const res = await fetchProductById(id);
      if (res.data.success) {
        setProduct(res.data.product);
        
        // Fetch related products (same category)
        const allRes = await fetchAllProducts();
        if (allRes.data.success) {
          const related = allRes.data.products.filter(p => 
            p.category === res.data.product.category && p._id !== id
          ).slice(0, 3); // Max 3 related products
          setRelatedProducts(related);
        }
      }
    } catch (err) {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      alert('Only buyers can add items to cart!');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product._id, 1);
      alert('Product added to cart successfully!');
    } catch (err) {
      alert('Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error || !product) return <Container className="mt-5"><Alert variant="danger">{error || 'Product not found'}</Alert></Container>;

  return (
    <Container>
      <Row className="mb-5">
        <Col md={6}>
          <img 
            src={`http://localhost:5000${product.image}`} 
            alt={product.item_name} 
            className="img-fluid rounded shadow"
            style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
          />
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100 border-0">
            <Card.Body className="d-flex flex-column">
              <h2>{product.item_name}</h2>
              <h4 className="text-primary mb-3">{formatCurrency(product.price)}</h4>
              <p className="text-muted mb-2"><strong>Category:</strong> {product.category}</p>
              <p className="text-muted mb-4"><strong>Seller:</strong> {product.seller_name || 'Anonymous'}</p>
              
              <h5>Description</h5>
              <p className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>{product.description}</p>
              
              <div className="mt-auto">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100" 
                  onClick={handleAddToCart}
                  disabled={addingToCart || user?.role === 'seller'}
                >
                  {addingToCart ? <Spinner size="sm" animation="border" /> : 'Add to Cart'}
                </Button>
                {user?.role === 'seller' && (
                  <p className="text-danger mt-2 text-center mt-2">Sellers cannot add items to cart.</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-4 text-center border-bottom pb-2">Related Products</h3>
          <Row xs={1} md={3} className="g-4">
            {relatedProducts.map(relProduct => (
              <Col key={relProduct._id}>
                <ProductCard product={relProduct} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
};

export default ProductDetails;
