import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Row, Col, Container, Button } from 'react-bootstrap';
import '../css/UserLogin.css';

function StudentLogin({ setIsAuthenticated, setUserId }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/userlogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        const { access_token, user_id } = data; // Ensure the backend returns both

        if (!access_token || user_id === null || user_id === undefined) {
          alert('Invalid response from server.');
          return;
        }

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('id', user_id.toString()); // ✅ Store user ID

      setIsAuthenticated(true);
      setUserId(user_id); // ✅ Update React state
      navigate('/userhome');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again later.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin();
  };

  return (
    <div className="user-login-wrapper">
      <Container className="login-container" >
        <h3 className="login-heading">User Login</h3>
        <Form onSubmit={handleSubmit} className="login-form">
          <Row>
            <Col>
              <Form.Group controlId="formEmail">
                <Form.Label className="login-labels">Email:</Form.Label>
                <Form.Control
                  className="login-inputs"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
            <Form.Group controlId="formPassword">
              <Form.Label className="login-labels">Password:</Form.Label>
              <Form.Control
                className="login-inputs"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            </Col>
          </Row>
          <Button variant="primary" type="submit" className='login-button'>
            Login
          </Button>
        </Form>
      </Container>
    </div>
  );
}

export default StudentLogin;