import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { fetchAllProducts } from '../services/api';

const Catalogue = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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

  // Sort local copy of filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceLowHigh') return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === 'priceHighLow') return parseFloat(b.price) - parseFloat(a.price);
    // default 'newest'
    return new Date(b.created_at || 0) < new Date(a.created_at || 0) ? 1 : -1;
  });

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>MarketVerse Catalogue</h2>
        <div className="d-flex align-items-center">
          <Form.Select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            <option value="newest">Sort By: Newest</option>
            <option value="priceLowHigh">Sort By: Price (Low to High)</option>
            <option value="priceHighLow">Sort By: Price (High to Low)</option>
          </Form.Select>
        </div>
      </div>
      
      <div className="mb-4 d-flex justify-content-center">
        <div style={{ width: '400px' }}>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>
      
      {sortedProducts.length === 0 ? (
        <Alert variant="info" className="text-center">No products match your search criteria.</Alert>
      ) : (
        <Row xs={1} md={2} lg={4} className="g-4">
          {sortedProducts.map(product => (
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
