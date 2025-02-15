import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar";
// this is for admin
import CreateAccount from "./AdminDashboard/CreateAccount";
import ManageAccount from "./AdminDashboard/ManageAccount";
// this is for instructor
import CreateExam from "./InstructorDashboard/CreateExam";
// this is for student
import TakeExam from "./StudentDashboard/TakeExam";

const Dashboard = () => {
  // Get user data from localStorage
  let storedUserData = localStorage.getItem("userData");
  let userData;
  try {
    userData = storedUserData ? JSON.parse(storedUserData) : {};
  } catch (error) {
    console.error("Error parsing userData from localStorage:", error);
    userData = {};
  }
  const role = userData?.role || "Student";

  return (
    <Container fluid>
      <Row>
        <Col md={2} className="bg-dark text-white">
          <Sidebar role={role} />
        </Col>
        <Col md={10} className="dashboard-content">
          <div className="p-4">
            <Routes>
              {role === "Admin" && (
                <>
                  <Route path="/" element={<CreateAccount />} />
                  <Route path="create-account" element={<CreateAccount />} />
                  <Route path="manage-account" element={<ManageAccount />} />
                </>
              )}
              {role === "Instructor" && (
                <>
                  <Route path="/" element={<CreateExam />} />
                  <Route path="create-exam" element={<CreateExam />} />
                </>
              )}
              {role === "Student" && (
                <>
                  <Route path="/" element={<TakeExam />} />{" "}
                  <Route path="take-exam" element={<TakeExam />} />{" "}
                </>
              )}
              <Route path="*" element={<h4>Page Not Found</h4>} />
            </Routes>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
