import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import { useLocation } from "react-router-dom";

const AdminDashboard = () => (
  <div>
    <h2>Admin Dashboard</h2>
    <p>Welcome, Admin! You can manage users and configure settings here.</p>
  </div>
);

const InstructorDashboard = () => (
  <div>
    <h2>Instructor Dashboard</h2>
    <p>
      Welcome, Instructor! You can manage courses and interact with students
      here.
    </p>
  </div>
);

const StudentDashboard = () => (
  <div>
    <h2>Student Dashboard</h2>
    <p>
      Welcome, Student! View your enrolled courses and participate in
      discussions.
    </p>
  </div>
);

const Dashboard = () => {
  // Get the user data from the location state or local storage
  const location = useLocation();
  const userData =
    location.state || JSON.parse(localStorage.getItem("userData")) || {};
  const role = userData?.role || "user";

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
