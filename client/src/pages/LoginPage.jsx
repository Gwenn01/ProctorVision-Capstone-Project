import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button, Form, Card } from "react-bootstrap";
import "../styles/loginpage.css";
import logo from "../assets/logo.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../components/Spinner";

const LoginPage = () => {
  // define the varibales and hooks
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  // handle navigation function to navigate to the next page and store user data
  const handleNavigation = (path, selectedRole) => {
    navigate(path, { state: { role: selectedRole } });
    setLoading(false);
  };
  // handle login function
  const handleLogin = async (e) => {
    e.preventDefault();
    // check if the username and password are empty
    if (!username || !password) {
      toast.error("Please enter both username and password.");
      return;
    }
    //
    try {
      setLoading(true);
      // fetch the data into the database
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      // check if the data is valid
      if (!response.ok) {
        throw new Error(response.status);
      }
      toast.success("Login successful!");
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userData", data);
      setTimeout(() => {
        handleNavigation("/dashboard", selectedRole);
      }, 1000);
      // display the error if the data is invalid
    } catch (error) {
      if (error.message === "401") {
        toast.error("Invalid username or password. Please try again.");
      } else {
        toast.error("Server error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center vh-100">
      <ToastContainer autoClose={3000} position="top-right" />
      {!selectedRole ? (
        <div className="text-center role-button">
          <Container className="content-login">
            <img src={logo} alt="PRMSU Logo" className="mb-3 logo" />
            <h2 className="text-title">
              President Ramon Magsaysay State University
            </h2>
            <p className="text-title">
              ProctorVision: AI-Powered Exam Behavior Monitoring System
            </p>
            <p className="text-title">
              PRMSU CCIT Laboratory Building, Iba Campus
            </p>
          </Container>
          <div className="d-flex gap-3 button-container">
            <Button
              className="buttons"
              variant="secondary"
              onClick={() => setSelectedRole("Admin")}
            >
              Admin
            </Button>
            <Button
              className="buttons"
              variant="secondary"
              onClick={() => setSelectedRole("Instructor")}
            >
              Instructor
            </Button>
            <Button
              className="buttons"
              variant="secondary"
              onClick={() => setSelectedRole("Student")}
            >
              Student
            </Button>
          </div>
        </div>
      ) : (
        <Card className="shadow-lg border-0 p-4" style={{ width: "24rem" }}>
          <Card.Body>
            <Card.Title className="text-center mb-3 fw-bold fs-4">
              {selectedRole} Login
            </Card.Title>
            <Form className="mb-4" onSubmit={handleLogin}>
              <Form.Group className="mb-1">
                <Form.Label className="fw-semibold d-flex">Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  className="py-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-1">
                <Form.Label className="fw-semibold d-flex">Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  className="py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
            <Button
              variant="secondary"
              className="w-100 py-2 mt-3"
              onClick={() => setSelectedRole(null)}
            >
              Back
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default LoginPage;
