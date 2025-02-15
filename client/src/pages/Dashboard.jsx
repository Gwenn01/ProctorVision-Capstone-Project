import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import AdminDashboard from "./AdminDashboard";
import InstructorDashboard from "./InstructorDashboard";
import StudentDashboard from "./StudentDashboard";

const Dashboard = () => {
  // Safely retrieve user data from localStorage
  let storedUserData = localStorage.getItem("userData");

  let userData;
  try {
    userData = storedUserData ? JSON.parse(storedUserData) : {};
  } catch (error) {
    console.error("Error parsing userData from localStorage:", error);
    userData = {};
  }

  // Always use role from localStorage instead of location.state
  const role = userData?.role || "Student";

  let Content;
  if (role === "Admin") {
    Content = <AdminDashboard />;
  } else if (role === "Instructor") {
    Content = <InstructorDashboard />;
  } else {
    Content = <StudentDashboard />;
  }

  return (
    <Container fluid>
      <Row>
        <Col md={2} className="bg-dark text-white">
          <Sidebar role={role} userData={userData} />
        </Col>
        <Col md={10}>
          <div className="p-4">{Content}</div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
