import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <Card className="h-100 shadow-sm">
      <Card.Img 
        variant="top" 
        src={`http://localhost:5000${product.image}`} 
        style={{ height: '200px', objectFit: 'cover' }} 
        alt={product.item_name}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{product.item_name}</Card.Title>
        <Card.Subtitle className="mb-2 text-primary">{formatCurrency(product.price)}</Card.Subtitle>
        <div className="mb-2 small">
          {product.stock > 0 ? (
            <span className="text-success">In Stock: {product.stock}</span>
          ) : (
            <span className="text-danger fw-bold">Out of Stock</span>
          )}
        </div>
        <Card.Text className="text-truncate">
          {product.description}
        </Card.Text>
        <div className="mt-auto d-flex justify-content-between">
          <Button variant="primary" onClick={() => navigate(`/product/${product._id}`)}>
            View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
