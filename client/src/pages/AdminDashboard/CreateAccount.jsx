import React, { useState } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  Spinner,
  Row,
  Col,
  InputGroup,
  Table,
} from "react-bootstrap";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUser,
  FaEnvelope,
  FaKey,
  FaIdBadge,
  FaUserCircle,
  FaGraduationCap,
  FaLayerGroup,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaFileExcel,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const CreateAccount = () => {
  const [userType, setUserType] = useState(null);
  const [studentFormMode, setStudentFormMode] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    course: "",
    section: "",
    year: "",
    status: "",
  });
  const [excelMeta, setExcelMeta] = useState({
    course: "",
    section: "",
    year: "",
    status: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      const updatedData = data.map((row, i) => {
        const fullName = row.name || row.fullname || "";
        const username =
          row.username || fullName.toLowerCase().replace(/\s+/g, "") + i;
        const email = row.email || `${username}@student.prmsu.edu.ph`;
        const password = row.password || `${username}123`;
        return { ...row, username, email, password };
      });
      setExcelData(updatedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelSubmit = async () => {
    setLoading(true);
    if (
      !excelMeta.course ||
      !excelMeta.year ||
      !excelMeta.section ||
      !excelMeta.status
    ) {
      toast.error("Please select all meta fields for Excel import.");
      return;
    }
    if (excelData.length === 0) {
      toast.error("No Excel data to submit.");
      return;
    }
    try {
      const response = await fetch(
        "http://localhost:5000/api/bulk_create_students",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: excelData, meta: excelMeta }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        toast.success(`${excelData.length} students imported successfully!`);
        setExcelData([]);
      } else {
        toast.error(result.error || "Failed to import students.");
      }
    } catch (err) {
      toast.error("Server error during import.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoading(true);

    // Only validate student fields if the user type is Student
    if (
      formData.name === "" ||
      formData.username === "" ||
      formData.password === "" ||
      formData.email === "" ||
      (userType === "Student" &&
        (formData.course === "" ||
          formData.year === "" ||
          formData.section === "" ||
          formData.status === ""))
    ) {
      toast.error("Please fill and select all fields.");
      setLoading(false); // stop the spinner if validation fails
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/create_account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userType }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
        setFormData({
          name: "",
          username: "",
          email: "",
          password: "",
          course: "",
          section: "",
          year: "",
          status: "",
        });
        setUserType(null);
        setStudentFormMode(null);
      } else {
        toast.error(result.error || "Failed to create account.");
      }
    } catch (err) {
      toast.error("Server error: Failed to connect.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <ToastContainer />
      <Card
        className="shadow-lg p-4 rounded-4 w-100"
        style={{ maxWidth: "700px" }}
      >
        <Card.Body>
          <div className="text-center mb-4">
            <FaUserCircle size={64} className="text-dark mb-2" />
            <Card.Title className="fw-bold fs-3 text-dark">
              Create Account
            </Card.Title>
          </div>

          {!userType ? (
            <>
              <p className="text-center text-muted mb-3">
                Select the type of account you want to create:
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button
                  variant="outline-dark"
                  onClick={() => setUserType("Student")}
                >
                  <FaUserGraduate className="me-2" /> Student
                </Button>
                <Button
                  variant="outline-dark"
                  onClick={() => setUserType("Instructor")}
                >
                  <FaChalkboardTeacher className="me-2" /> Instructor
                </Button>
              </div>
            </>
          ) : loading ? (
            <div className="text-center mt-4">
              <Spinner animation="border" variant="dark" />
              <p className="mt-2 text-muted">Creating account...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {userType === "Instructor" && (
                <>
                  <p className="text-center text-muted mb-4">
                    Creating an <strong>Instructor</strong> account
                  </p>
                  {/* Instructor Form Fields */}
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaUser />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaIdBadge />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaEnvelope />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaKey />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </>
              )}

              {userType === "Student" && !studentFormMode && (
                <>
                  <h5 className="text-center fw-semibold my-4">
                    Choose Registration Method
                  </h5>
                  <div className="d-flex justify-content-center gap-4">
                    <Button
                      variant="primary"
                      onClick={() => setStudentFormMode("manual")}
                    >
                      <FaPlus className="me-2" /> Add Manually
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => setStudentFormMode("excel")}
                    >
                      <FaFileExcel className="me-2" /> Upload Excel
                    </Button>
                  </div>
                </>
              )}

              {studentFormMode === "manual" && (
                <>
                  <p className="text-center text-muted mt-4 mb-3">
                    Manual Student Registration
                  </p>

                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaUser />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaIdBadge />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="username"
                        placeholder="Enter username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaEnvelope />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaKey />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Course</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaGraduationCap />
                      </InputGroup.Text>
                      <Form.Select
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Course --</option>
                        <option value="BS Information Technology">
                          BS Information Technology
                        </option>
                        <option value="BS Computer Science">
                          BS Computer Science
                        </option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Year</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaLayerGroup />
                      </InputGroup.Text>
                      <Form.Select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Year --</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Section</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaLayerGroup />
                      </InputGroup.Text>
                      <Form.Select
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Section --</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaLayerGroup />
                      </InputGroup.Text>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Status --</option>
                        <option value="Regular">Regular</option>
                        <option value="Irregular">Irregular</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>
                </>
              )}

              {studentFormMode === "excel" && (
                <>
                  <p className="text-center text-muted mt-4 mb-3">
                    Upload Student List via Excel
                  </p>
                  <Form.Group className="mb-2">
                    <Form.Label>Upload Excel (.xlsx) file</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".xlsx"
                      onChange={handleExcelUpload}
                    />
                    <Form.Text className="text-muted">
                      Expected column: <strong>name</strong>. Email & username
                      will be auto-generated if missing.
                    </Form.Text>
                  </Form.Group>

                  <Row className="mb-3">
                    <Col>
                      <Form.Label>Course</Form.Label>
                      <Form.Select
                        required
                        value={excelMeta.course}
                        onChange={(e) =>
                          setExcelMeta({ ...excelMeta, course: e.target.value })
                        }
                      >
                        <option value="">-- Select Course --</option>
                        <option value="BS Information Technology">
                          BS Information Technology
                        </option>
                        <option value="BS Computer Science">
                          BS Computer Science
                        </option>
                      </Form.Select>
                    </Col>
                    <Col>
                      <Form.Label>Year</Form.Label>
                      <Form.Select
                        required
                        value={excelMeta.year}
                        onChange={(e) =>
                          setExcelMeta({ ...excelMeta, year: e.target.value })
                        }
                      >
                        <option value="">-- Select Year --</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4tt Year</option>
                        <option value="5th Year">5th Year</option>
                      </Form.Select>
                    </Col>
                    <Col>
                      <Form.Label>Section</Form.Label>
                      <Form.Select
                        required
                        value={excelMeta.section}
                        onChange={(e) =>
                          setExcelMeta({
                            ...excelMeta,
                            section: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Select Section --</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                      </Form.Select>
                    </Col>
                    <Col>
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        required
                        value={excelMeta.status}
                        onChange={(e) =>
                          setExcelMeta({ ...excelMeta, status: e.target.value })
                        }
                      >
                        <option value="">-- Select Status --</option>
                        <option value="Regular">Regular</option>
                        <option value="Irregular">Irregular</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  {excelData.length > 0 && (
                    <Table striped bordered hover responsive className="mt-4">
                      <thead>
                        <tr>
                          {Object.keys(excelData[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val, idx) => (
                              <td key={idx}>{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </>
              )}

              {(userType === "Instructor" || studentFormMode === "manual") && (
                <Row className="mt-4">
                  <Col className="text-start">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setUserType(null);
                        setStudentFormMode(null);
                      }}
                    >
                      Back
                    </Button>
                  </Col>
                  <Col className="text-end">
                    <Button variant="dark" type="submit">
                      Create Account
                    </Button>
                  </Col>
                </Row>
              )}

              {studentFormMode === "excel" && (
                <Row className="mt-4">
                  <Col className="text-start">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setUserType(null);
                        setStudentFormMode(null);
                      }}
                    >
                      Back
                    </Button>
                  </Col>
                  <Col className="text-end">
                    <Button variant="success" onClick={handleExcelSubmit}>
                      Submit Excel Data
                    </Button>
                  </Col>
                </Row>
              )}
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateAccount;
