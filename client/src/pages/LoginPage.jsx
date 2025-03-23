import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button, Form, Card } from "react-bootstrap";
import { FaUser, FaLock } from "react-icons/fa"; // Import icons
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../components/Spinner";
import logo from "../assets/prmsu-logo.png";
import "../styles/loginpage.css"; // Ensure you have CSS file for custom styling

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Invalid username or password"
            : "Server error"
        );
      }

      const data = await response.json();
      toast.success("Login successful!");
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userData", JSON.stringify(data));

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center vh-100 login-container">
      <ToastContainer autoClose={3000} position="top-right" />

      {/* Login Form */}
      <Card className="shadow-lg border-0 p-4 login-card">
        <Card.Body>
          <div className="text-center mb-3">
            <img
              src={logo}
              alt="PRMSU Logo"
              className="logo"
              style={{ width: "2rem", height: "2rem" }}
            />
            <h2 className="text-title">ProctorVision</h2>
            <p className="text-muted">AI-Powered Exam Behavior Monitoring</p>
          </div>

          <Card.Title className="text-center mb-3 fw-bold fs-4">
            Login
          </Card.Title>

          <Form className="mb-4" onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold d-flex">Username</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaUser />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  className="py-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold d-flex">Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaLock />
                </span>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  className="py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </Form.Group>

            <Button
              variant="dark"
              className="w-100 py-2 mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? <Spinner /> : "Login"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginPage;
