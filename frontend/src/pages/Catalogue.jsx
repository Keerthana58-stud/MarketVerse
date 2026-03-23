import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { fetchAllProducts } from '../services/api';

const Catalogue = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetchAllProducts();
      if (res.data.success) {
        setProducts(res.data.products);
        setFilteredProducts(res.data.products);
      }
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm, category = '') => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(p => p.item_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    setFilteredProducts(filtered);
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container>
      <h2 className="mb-4 text-center">MarketVerse Catalogue</h2>
      <SearchBar onSearch={handleSearch} />
      
      {filteredProducts.length === 0 ? (
        <Alert variant="info" className="text-center">No products found.</Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredProducts.map(product => (
            <Col key={product._id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Catalogue;
