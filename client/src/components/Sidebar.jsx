import React from "react";
import { Nav } from "react-bootstrap";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../styles/sidebar.css";
import { toast } from "react-toastify";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation(); // To highlight active links

  const handleLogout = () => {
    // Remove user data from localStorage
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    toast.success("Logged out successfully!", {
      autoClose: 2000, // Keep the toast visible longer
    });
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1000); // Wait 2 seconds before redirecting
  };

  const menuItems = {
    Admin: [
      { href: "create-account", icon: "people", label: "Create Account" },
      { href: "manage-account", icon: "gear", label: "Manage Account" },
    ],
    Instructor: [
      { href: "manage-student", icon: "person", label: "Manage Student" },
      { href: "create-exam", icon: "book", label: "Exam Setup" },
      { href: "manage-exam", icon: "chat", label: "Manage Exam" },
      {
        href: "student-behavior",
        icon: "bar-chart",
        label: "Student Behavior",
      },
    ],
    Student: [
      { href: "take-exam", icon: "book", label: "Take Exam" },
      { href: "your-behavior", icon: "bar-chart", label: "Exam Behavior" },
    ],
  };

  const panelTitle =
    role === "Admin"
      ? "Admin Panel"
      : role === "Instructor"
      ? "Instructor Panel"
      : "Student Dashboard";
  const links = menuItems[role] || menuItems.Student;

  return (
    <div className="sidebar bg-dark text-white vh-100 d-flex flex-column justify-content-between p-3">
      {/* Sidebar Header */}
      <div>
        <h4 className="text-center mb-4">{panelTitle}</h4>
        <Nav className="flex-column list-unstyled">
          {links.map((link, index) => (
            <Nav.Item key={index} className="py-2">
              <Link
                to={`/dashboard/${link.href}`}
                className={`nav-link text-white d-flex align-items-center p-2 rounded ${
                  location.pathname.includes(link.href)
                    ? "active bg-primary"
                    : ""
                }`}
              >
                <i className={`bi bi-${link.icon} me-2 fs-5`}></i> {link.label}
              </Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>

      {/* Logout Button */}
      <Nav.Item className="py-2 mt-auto">
        <span
          className="nav-link text-white d-flex align-items-center p-2 rounded logout-button"
          role="button"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-2 fs-5"></i> Logout
        </span>
      </Nav.Item>
    </div>
  );
};

export default Sidebar;
