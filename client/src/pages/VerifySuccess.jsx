// src/pages/VerifySuccess.jsx
import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const VerifySuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <FaCheckCircle className="text-green-500 text-5xl mb-4 mx-auto" />
        <h2 className="text-2xl font-semibold mb-2">Account Verified!</h2>
        <p className="text-gray-600 mb-6">
          Your email has been verified successfully. You can now log in to your
          account.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default VerifySuccess;
