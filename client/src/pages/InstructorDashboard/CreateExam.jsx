import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  Row,
  Col,
  ListGroup,
  Modal,
  Accordion,
} from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";
import { FaSearch } from "react-icons/fa";

const CreateExam = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const instructorId = userData.id;

  const [examType, setExamType] = useState("");
  const [examCategory, setExamCategory] = useState("CODING");
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    time: 20,
  });

  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [examFile, setExamFile] = useState(null);

  const [allStudents, setAllStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [filters, setFilters] = useState({ course: "", year: "", section: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // exam instruction
  const [examInstructions, setExamInstructions] = useState("");

  // Questions + preview modal
  const [questions, setQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/all-students");
      setAllStudents(res.data);
    } catch (err) {
      toast.error("Failed to load students.");
    }
  };

  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setExamData((prev) => ({
      ...prev,
      [name]: name === "time" ? parseInt(value) : value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleBulkAssign = () => {
    const filtered = allStudents.filter(
      (s) =>
        s.course === filters.course &&
        s.year === filters.year &&
        s.section === filters.section
    );

    const newStudents = filtered.filter(
      (s) => !enrolledStudents.some((e) => e.id === s.id)
    );

    if (newStudents.length === 0) {
      toast.info("No new students to assign.");
      return;
    }

    setEnrolledStudents([...enrolledStudents, ...newStudents]);
    toast.success(`Added ${newStudents.length} students.`);
  };

  const handleAddIndividual = () => {
    const student = allStudents.find(
      (s) => s.id.toString() === selectedStudent
    );

    if (!student) return;

    if (enrolledStudents.some((s) => s.id === student.id)) {
      toast.warning("Student already added.");
      return;
    }

    setEnrolledStudents([...enrolledStudents, student]);
    toast.success(`Added student.`);
    setSelectedStudent("");
  };

  const handleRemoveStudent = (id) => {
    setEnrolledStudents(enrolledStudents.filter((s) => s.id !== id));
  };

  // state you already have:
  const handleUploadInstructionFile = async (file) => {
    if (!file) return;

    // Optional: guard supported types
    const ok = /\.(pdf|docx?|txt)$/i.test(file.name);
    if (!ok) {
      toast.error("Unsupported file type. Use PDF, DOCX, DOC, or TXT.");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await axios.post(
        "http://localhost:5000/api/parse-instructions",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const text = (res?.data?.instructions || "").trim();

      if (!text) {
        toast.warn("No extractable text found in the file.");
      } else {
        // Put extracted text into the textarea so instructor can edit it
        setExamInstructions(text);
        // Optionally auto-pick the format as CODING (instructions flow)
        if (!examCategory) setExamCategory("CODING");
        toast.success("Instructions extracted. You can edit them now.");
      }

      // keep the file reference if you still want to submit it with the form
      setExamFile(file);
    } catch (err) {
      console.error(err);
      toast.error("Failed to extract text from the file.");
    } finally {
      setLoading(false);
    }
  };

  // Question Handlers
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", type: "mcq", options: ["", ""], correctAnswer: null },
    ]);
  };

  const updateQuestionText = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].questionText = value;
    setQuestions(updated);
  };

  // Update type
  const updateQuestionType = (qIndex, newType) => {
    const updated = [...questions];
    updated[qIndex].type = newType;

    // Reset fields when switching types
    if (newType === "mcq") {
      updated[qIndex].options = ["", ""];
      updated[qIndex].correctAnswer = null;
    } else if (newType === "identification") {
      updated[qIndex].options = [];
      updated[qIndex].correctAnswer = "";
    } else if (newType === "essay") {
      updated[qIndex].options = [];
      updated[qIndex].correctAnswer = null;
    }

    setQuestions(updated);
  };

  // Update correct answer for identification
  const updateCorrectAnswer = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push("");
    setQuestions(updated);
  };
  const removeOption = (qIndex, oIndex) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      if (!q) return prev;

      // enforce at least 2 options
      if ((q.options?.length ?? 0) <= 2) {
        // optional toast, safe if not present
        try {
          toast?.warning?.("A question must have at least 2 options.");
        } catch {}
        return prev;
      }

      // clone question & options
      const newOptions = q.options.filter((_, i) => i !== oIndex);

      // fix correctAnswer index
      let newCorrect = q.correctAnswer;
      if (newCorrect === oIndex)
        newCorrect = null; // deleted the correct option
      else if (typeof newCorrect === "number" && newCorrect > oIndex)
        newCorrect -= 1; // shift left

      next[qIndex] = { ...q, options: newOptions, correctAnswer: newCorrect };
      return next;
    });
  };

  const selectCorrectAnswer = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = oIndex;
    setQuestions(updated);
  };

  const removeQuestion = (qIndex) => {
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  };

  const clearCorrectAnswer = (qIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, correctAnswer: null } : q))
    );
  };

  // handle pasre exam from pdf or words
  const handleUploadQuestionsFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/parse-questions",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      // Merge parsed questions into state
      // Merge parsed questions into state
      setQuestions([
        ...questions,
        ...res.data.questions.map((q) => ({
          questionText: q.questionText,
          type: q.type || "mcq", // fallback
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? null,
        })),
      ]);

      // Attach the file to the exam so it gets persisted to DB on save
      setExamFile(file);
      toast.success("Questions imported! You can now edit them.");
    } catch (err) {
      toast.error("Failed to parse questions.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // save correct answers
  const handleSaveExam = async () => {
    const { title, description, time } = examData;

    if (!title || !description || time <= 0 || !examDate || !startTime) {
      toast.error("Please complete all required fields.");
      return;
    }

    // replace both checks with this single condition
    if (!examInstructions?.trim() && questions.length === 0) {
      toast.error(
        "Add instructions (for CODING) or at least one question (for MCQ)."
      );
      return;
    }

    if (enrolledStudents.length === 0) {
      toast.warning("Please assign at least one student.");
      return;
    }

    console.log(examInstructions.trim());
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("time", time);
    formData.append("exam_date", examDate);
    formData.append("start_time", startTime);
    formData.append("instructor_id", instructorId);
    formData.append("exam_type", examType);
    formData.append("exam_category", examCategory);
    formData.append("students", JSON.stringify(enrolledStudents));
    formData.append("questions", JSON.stringify(questions));
    formData.append("instructions", examInstructions.trim());

    if (examFile) {
      formData.append("exam_file", examFile);
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/create-exam",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success(`${examType} created successfully!`);
      window.location.reload();
      console.log(`${examType} Created:`, res.data);
    } catch (err) {
      toast.error("Failed to save.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const courseOptions = [...new Set(allStudents.map((s) => s.course))];
  const yearOptions = [...new Set(allStudents.map((s) => s.year))];
  const sectionOptions = [...new Set(allStudents.map((s) => s.section))];

  const isInvalid = (value) => !value || value === "";

  return (
    <Container fluid className="py-4 px-3 px-md-5">
      <ToastContainer autoClose={2500} />

      {!examType ? (
        <Card className="shadow-lg border-0 p-5 text-center">
          <h3 className="fw-bold mb-4">Select What You Want to Create</h3>
          <Row className="g-4 justify-content-center">
            <Col xs={12} md={5}>
              <Button
                variant="primary"
                size="lg"
                className="w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setExamType("Exam")}
                disabled={loading}
              >
                <i className="bi bi-journal-text fs-3"></i>
                <span className="fw-semibold">Create Exam</span>
              </Button>
            </Col>
            <Col xs={12} md={5}>
              <Button
                variant="info"
                size="lg"
                className="w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setExamType("Activity")}
                disabled={loading}
              >
                <i className="bi bi-pencil-square fs-3"></i>
                <span className="fw-semibold">Create Activity</span>
              </Button>
            </Col>
          </Row>
        </Card>
      ) : (
        <Card className="shadow-lg border-0 p-4">
          <Card.Body>
            <h2 className="text-center fw-bold mb-4">
              {examType === "Exam" ? (
                <>
                  <i className="bi bi-journal-text me-2"></i>Create Exam
                </>
              ) : (
                <>
                  <i className="bi bi-pencil-square me-2"></i>Create Activity
                </>
              )}
            </h2>
            {/* Title */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={examData.title}
                onChange={handleExamChange}
                placeholder={`Enter ${examType.toLowerCase()} title`}
                className={isInvalid(examData.title) ? "is-invalid" : ""}
                disabled={loading}
              />
            </Form.Group>
            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={examData.description}
                onChange={handleExamChange}
                placeholder={`Brief ${examType.toLowerCase()} description`}
                className={isInvalid(examData.description) ? "is-invalid" : ""}
                disabled={loading}
              />
            </Form.Group>
            {/* Duration */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Duration (minutes)
              </Form.Label>
              <Form.Control
                type="number"
                name="time"
                value={examData.time}
                min={1}
                onChange={handleExamChange}
                className={examData.time <= 0 ? "is-invalid" : ""}
                disabled={loading}
              />
            </Form.Group>
            {/* Date */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">{examType} Date</Form.Label>
              <Form.Control
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className={isInvalid(examDate) ? "is-invalid" : ""}
                disabled={loading}
              />
            </Form.Group>
            {/* Start Time */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Start Time</Form.Label>
              <Form.Control
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={isInvalid(startTime) ? "is-invalid" : ""}
                disabled={loading}
              />
            </Form.Group>

            {/* Category Picker */}
            {/* Exam Format Picker */}
            <Card className="mb-4 border-0 shadow-sm rounded-3">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-sliders2-vertical fs-5 text-primary"></i>
                    <h5 className="fw-semibold mb-0">Exam Format</h5>
                  </div>
                  {examCategory && (
                    <span className="badge bg-light text-dark border">
                      Selected:{" "}
                      {examCategory === "CODING"
                        ? "Coding / Instructions"
                        : "QA"}
                    </span>
                  )}
                </div>

                <Form.Group controlId="examCategory">
                  <Form.Label className="fw-semibold">Format</Form.Label>
                  {/* Keep values aligned with backend expectations: "MCQ" | "CODING" */}
                  <Form.Select
                    value={examCategory}
                    onChange={(e) => setExamCategory(e.target.value)}
                    disabled={loading}
                    className="w-100"
                  >
                    <option value="">— Select format —</option>
                    <option value="CODING">Coding (Instructions Only)</option>
                    <option value="QA">QA (Questions & Answers)</option>
                  </Form.Select>
                  <div className="form-text mt-2">
                    {examCategory === "QA" && (
                      <>You’ll create multiple-choice questions below.</>
                    )}
                    {examCategory === "CODING" && (
                      <>
                        Provide clear instructions; no QA section will be shown.
                      </>
                    )}
                    {!examCategory && <>Pick a format to continue.</>}
                  </div>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Instructions Section — show ONLY for CODING */}
            {examCategory === "CODING" && (
              <Card className="mb-4 border border-5">
                <Card.Body>
                  <h5 className="fw-bold mb-3">
                    {examType || "Exam"} Instructions
                  </h5>

                  {/* Required Instructions */}
                  <Form.Group className="mb-3" controlId="examInstructions">
                    <Form.Label className="fw-semibold">
                      Instructions <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder={`Enter clear ${
                        examType || "exam"
                      } instructions for students`}
                      value={examInstructions}
                      onChange={(e) => setExamInstructions(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  {/* Optional File */}
                  <Form.Group controlId="examFile">
                    <Form.Label className="fw-semibold">
                      Upload Instruction File (PDF/DOC/DOCX/TXT)
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) =>
                        handleUploadInstructionFile(e.target.files[0])
                      }
                      disabled={loading}
                    />
                    <Form.Text className="text-muted">
                      (Optional) Attach a file; its text will be placed in the
                      editor below.
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            )}
            {/* Questions Section — show ONLY for MCQ and when examType is 'Exam' */}
            {examType === "Exam" && examCategory === "QA" && (
              <Card className="mb-4 border border-5">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Create Questions</h5>
                  <Accordion alwaysOpen>
                    {questions.map((q, qIndex) => (
                      <Accordion.Item eventKey={qIndex.toString()} key={qIndex}>
                        <Accordion.Header>
                          Question {qIndex + 1}:{" "}
                          {q.questionText || "Untitled Question"}
                        </Accordion.Header>
                        <Accordion.Body>
                          {/* Question Type Selector */}
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              Question Type
                            </Form.Label>
                            <Form.Select
                              value={q.type || "mcq"}
                              onChange={(e) =>
                                updateQuestionType(qIndex, e.target.value)
                              }
                              disabled={loading}
                            >
                              <option value="mcq">Multiple Choice</option>
                              <option value="identification">
                                Identification
                              </option>
                              <option value="essay">Essay</option>
                            </Form.Select>
                          </Form.Group>

                          {/* Question Text */}
                          <Form.Control
                            type="text"
                            placeholder="Enter question text"
                            value={q.questionText}
                            onChange={(e) =>
                              updateQuestionText(qIndex, e.target.value)
                            }
                            className={
                              isInvalid(q.questionText)
                                ? "is-invalid mb-3"
                                : "mb-3"
                            }
                            disabled={loading}
                          />

                          {/* Conditional Rendering by Question Type */}
                          {q.type === "mcq" && (
                            <>
                              {q.options.map((opt, oIndex) => (
                                <div
                                  key={oIndex}
                                  className="d-flex align-items-center mb-2 gap-2"
                                >
                                  <Form.Control
                                    type="text"
                                    placeholder={`Option ${oIndex + 1}`}
                                    value={opt}
                                    onChange={(e) =>
                                      updateOption(
                                        qIndex,
                                        oIndex,
                                        e.target.value
                                      )
                                    }
                                    className={
                                      isInvalid(opt) ? "is-invalid" : ""
                                    }
                                    disabled={loading}
                                  />
                                  <Form.Check
                                    type="radio"
                                    name={`correct-${qIndex}`}
                                    checked={q.correctAnswer === oIndex}
                                    onChange={() =>
                                      selectCorrectAnswer(qIndex, oIndex)
                                    }
                                    label="Correct"
                                    disabled={loading}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => removeOption(qIndex, oIndex)}
                                    disabled={loading || q.options.length <= 2}
                                  >
                                    <i className="bi bi-x-circle"></i>
                                  </Button>
                                </div>
                              ))}
                            </>
                          )}

                          {q.type === "identification" && (
                            <Form.Control
                              type="text"
                              placeholder="Enter correct answer"
                              value={q.correctAnswer || ""}
                              onChange={(e) =>
                                updateCorrectAnswer(qIndex, e.target.value)
                              }
                              className={
                                isInvalid(q.correctAnswer)
                                  ? "is-invalid mb-3"
                                  : "mb-3"
                              }
                              disabled={loading}
                            />
                          )}

                          {q.type === "essay" && (
                            <p className="text-muted">
                              Essay question – students will write their answer
                              manually.
                            </p>
                          )}

                          {/* ✅ Unified footer row */}
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            {/* Left side only for MCQ */}
                            {q.type === "mcq" && (
                              <div className="d-flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => addOption(qIndex)}
                                  disabled={loading}
                                >
                                  <i className="bi bi-plus-circle me-1"></i> Add
                                  Option
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => clearCorrectAnswer(qIndex)}
                                  disabled={loading || q.correctAnswer === null}
                                >
                                  <i className="bi bi-eraser me-1"></i> Clear
                                  Correct
                                </Button>
                              </div>
                            )}

                            {/* Right side always = Delete */}
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => removeQuestion(qIndex)}
                              disabled={loading}
                            >
                              <i className="bi bi-trash me-1"></i> Delete
                              Question
                            </Button>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>

                  <Button
                    variant="primary"
                    className="mt-3"
                    onClick={addQuestion}
                    disabled={loading}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add Question
                  </Button>

                  {/* Upload Questions File */}
                  <Form.Group className="mb-4 mt-3">
                    <Form.Label className="fw-semibold">
                      Upload Question File (PDF or DOCX)
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) =>
                        handleUploadQuestionsFile(e.target.files[0])
                      }
                      disabled={loading}
                    />
                    <Form.Text className="text-muted">
                      Upload a PDF/DOCX containing questions with options.
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            )}

            {/* Student Assignment */}
            <hr />
            <h5 className="fw-bold">Assign Students</h5>
            <Row className="mb-3">
              <Col md>
                <Form.Select
                  name="course"
                  value={filters.course}
                  onChange={handleFilterChange}
                >
                  <option value="">Select Course</option>
                  {courseOptions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md>
                <Form.Select
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                >
                  <option value="">Select Year</option>
                  {yearOptions.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md>
                <Form.Select
                  name="section"
                  value={filters.section}
                  onChange={handleFilterChange}
                >
                  <option value="">Select Section</option>
                  {sectionOptions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Button
                  className="w-100"
                  variant="primary"
                  onClick={handleBulkAssign}
                >
                  <i className="bi bi-people-fill me-2"></i>Add by Group
                </Button>
              </Col>
            </Row>
            {/* Add Individual Student */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Add Individual Student
              </Form.Label>
              <Row className="mb-2">
                <Col>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaSearch />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Search by name or username"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={9}>
                  <Form.Select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                  >
                    <option value="">Select Student</option>
                    {allStudents
                      .filter((s) =>
                        `${s.name} ${s.username}`
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.username})
                        </option>
                      ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Button
                    className="w-100"
                    variant="secondary"
                    onClick={handleAddIndividual}
                  >
                    <i className="bi bi-person-plus-fill me-2"></i>Add
                  </Button>
                </Col>
              </Row>
            </Form.Group>
            {/* Enrolled Students */}
            {enrolledStudents.length > 0 && (
              <Card className="mt-3 p-3 border-0 shadow-sm">
                <h6 className="fw-semibold mb-3">Enrolled Students:</h6>
                <ListGroup>
                  {enrolledStudents.map((student) => (
                    <ListGroup.Item
                      key={student.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      {student.name}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        <i className="bi bi-x-circle"></i>
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            )}
            {/* Preview & Save */}
            <div className="d-flex gap-2 mt-4">
              <Button
                variant="secondary"
                className="flex-fill"
                onClick={() => setShowPreview(true)}
                disabled={loading}
              >
                Preview Exam
              </Button>
              <Button
                variant="success"
                className="flex-fill"
                onClick={handleSaveExam}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Save " + examType}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Preview {examType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>{examData.title}</h5>
          <p>{examData.description}</p>
          <p>
            <strong>Duration:</strong> {examData.time} minutes <br />
            <strong>Date:</strong> {examDate} <br />
            <strong>Start Time:</strong> {startTime} <br />
            <strong>Category:</strong> {examCategory}
          </p>

          <hr />
          {/* Exam Instructions — show only when category is CODING */}
          {(examCategory || "").toUpperCase() === "CODING" && (
            <>
              <h6 className="mb-2">Exam Instructions</h6>
              <div
                className="p-3 border rounded bg-light"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {(examInstructions || "").trim() ? (
                  examInstructions
                ) : (
                  <em>No instructions provided yet.</em>
                )}
              </div>
            </>
          )}

          {/* Optional attached file */}
          {examFile && (
            <div className="mt-2">
              <strong>Attachment:</strong> {examFile.name}
              {typeof examFile.size === "number" && (
                <small className="text-muted ms-2">
                  ({Math.round(examFile.size / 1024)} KB)
                </small>
              )}
            </div>
          )}

          <hr />

          {/* Questions Preview (QA only) */}
          {(examCategory || "").toUpperCase() === "QA" &&
            (Array.isArray(questions) && questions.length > 0 ? (
              questions.map((q, i) => (
                <div key={i} className="mb-3 p-3 border rounded bg-light">
                  <h6 className="fw-bold">
                    {i + 1}. {q.questionText}
                  </h6>

                  {/* Preview based on type */}
                  {q.type === "mcq" && (
                    <ul className="list-unstyled ms-3">
                      {(q.options || []).map((opt, j) => (
                        <li
                          key={j}
                          style={{
                            fontWeight:
                              q.correctAnswer === j ? "bold" : "normal",
                            color: q.correctAnswer === j ? "green" : "inherit",
                          }}
                        >
                          {String.fromCharCode(65 + j)}. {opt}
                        </li>
                      ))}
                    </ul>
                  )}

                  {q.type === "identification" && (
                    <p className="text-primary ms-2">
                      <em>Answer:</em>{" "}
                      <span className="fw-semibold">
                        {q.correctAnswer || "_________"}
                      </span>
                    </p>
                  )}

                  {q.type === "essay" && (
                    <p className="text-muted ms-2 fst-italic">
                      Essay question – answer will be written by the student.
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted mb-0">
                <em>No questions added yet.</em>
              </p>
            ))}

          <hr />
          <h6>Enrolled Students:</h6>
          <ul>
            {enrolledStudents.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CreateExam;
