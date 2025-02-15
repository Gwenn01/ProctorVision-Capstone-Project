import React from "react";
import { Routes, Route } from "react-router-dom";
import CreateAccount from "./AdminDashboard/CreateAccount";

const AdminDashboard = () => {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome, Admin! You can manage users and configure settings here.</p>
      <Routes>
        <Route path="dashboard/create-account" element={<CreateAccount />} />
      </Routes>
    </div>
  );
};

export default AdminDashboard;
