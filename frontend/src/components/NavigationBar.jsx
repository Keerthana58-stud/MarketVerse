import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

const NavigationBar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">MarketVerse</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Catalogue</Nav.Link>
            {user?.role === 'buyer' && (
              <>
                <Nav.Link as={Link} to="/buyer-dashboard">Buyer Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/cart">Cart</Nav.Link>
              </>
            )}
            {user?.role === 'seller' && (
              <>
                <Nav.Link as={Link} to="/seller-dashboard">Seller Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/add-product">Add Product</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {token ? (
              <>
                <Navbar.Text className="me-3">
                  Signed in as: {user?.name} ({user?.role})
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
