import React from "react";
import { Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    navigate("/login", { replace: true });
  };

  const adminLinks = [
    { href: "#", icon: "bi bi-speedometer2", label: "Admin Dashboard" },
    { href: "#", icon: "bi bi-people", label: "Create Account" },
    { href: "#", icon: "bi bi-gear", label: "Manage Account" },
  ];

  const instructorLinks = [
    { href: "#", icon: "bi bi-journal", label: "Instructor Dashboard" },
    { href: "#", icon: "bi bi-book", label: "Create Exam" },
    { href: "#", icon: "bi bi-chat", label: "Manage Exam" },
    { href: "#", icon: "bi bi-chat", label: "Manage Student" },
    { href: "#", icon: "bi bi-chat", label: "Student Behavior" },
  ];

  const studentLinks = [
    { href: "#", icon: "bi bi-house-door", label: "Student Dashboard" },
    { href: "#", icon: "bi bi-book", label: "Exam" },
    { href: "#", icon: "bi bi-chat", label: "Exam Behavior" },
  ];

  let links;
  let panelTitle;

  if (role === "Admin") {
    links = adminLinks;
    panelTitle = "Admin Panel";
  } else if (role === "Instructor") {
    links = instructorLinks;
    panelTitle = "Instructor Panel";
  } else {
    links = studentLinks;
    panelTitle = "Student Dashboard";
  }

  return (
    <div className="bg-dark text-white p-3 vh-100 d-flex flex-column justify-content-between">
      <div>
        <h4 className="text-center mb-4">{panelTitle}</h4>
        <Nav className="flex-column">
          {links.map((link, index) => (
            <Nav.Link key={index} href={link.href} className="text-white py-2">
              <i className={`${link.icon} me-2`}></i> {link.label}
            </Nav.Link>
          ))}
        </Nav>
      </div>
      <Nav.Link
        href="#"
        className="text-white py-2 mt-auto"
        onClick={handleLogout}
      >
        <i className="bi bi-box-arrow-right me-2"></i> Logout
      </Nav.Link>
    </div>
  );
};

export default Sidebar;
