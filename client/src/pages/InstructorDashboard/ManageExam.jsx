import React, { useState } from "react";
import { Container, Table, Button, Modal, Form } from "react-bootstrap";

const ManageExam = () => {
  // Sample exam data (Replace this with backend data)
  const initialExams = [
    {
      id: 1,
      title: "Math Quiz",
      description: "Basic algebra questions",
      questions: [
        {
          questionText: "What is 2 + 2?",
          format: "Multiple Choice",
          options: ["2", "3", "4", "5"],
        },
        {
          questionText: "What is 5 - 3?",
          format: "Multiple Choice",
          options: ["1", "2", "3", "4"],
        },
      ],
    },
    {
      id: 2,
      title: "Science Test",
      description: "General science knowledge",
      questions: [
        {
          questionText: "What is H2O?",
          format: "Multiple Choice",
          options: ["Oxygen", "Water", "Hydrogen", "Carbon"],
        },
      ],
    },
  ];

  const [exams, setExams] = useState(initialExams);
  const [showModal, setShowModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Open modal to edit an exam
  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setShowModal(true);
  };

  // Handle deleting an exam
  const handleDeleteExam = (id) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      setExams(exams.filter((exam) => exam.id !== id));
    }
  };

  // Handle editing a question inside a modal
  const handleEditQuestion = (index, field, value) => {
    const updatedQuestions = [...selectedExam.questions];
    updatedQuestions[index][field] = value;
    setSelectedExam({ ...selectedExam, questions: updatedQuestions });
  };

  // Save changes to the exam
  const handleSaveChanges = () => {
    setExams(
      exams.map((exam) => (exam.id === selectedExam.id ? selectedExam : exam))
    );
    setShowModal(false);
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Manage Exams</h2>

      {/* Table to Display Exams */}
      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Questions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exams.length > 0 ? (
            exams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.id}</td>
                <td>{exam.title}</td>
                <td>{exam.description}</td>
                <td>{exam.questions.length}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEditExam(exam)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteExam(exam.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                No exams found
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Edit Exam Modal */}
      {selectedExam && (
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Exam: {selectedExam.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Exam Title</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedExam.title}
                  onChange={(e) =>
                    setSelectedExam({ ...selectedExam, title: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Exam Description</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedExam.description}
                  onChange={(e) =>
                    setSelectedExam({
                      ...selectedExam,
                      description: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <h5>Questions</h5>
              {selectedExam.questions.map((question, index) => (
                <div key={index} className="mb-3">
                  <Form.Group className="mb-2">
                    <Form.Label>Question {index + 1}</Form.Label>
                    <Form.Control
                      type="text"
                      value={question.questionText}
                      onChange={(e) =>
                        handleEditQuestion(
                          index,
                          "questionText",
                          e.target.value
                        )
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Format</Form.Label>
                    <Form.Select
                      value={question.format}
                      onChange={(e) =>
                        handleEditQuestion(index, "format", e.target.value)
                      }
                    >
                      <option>Multiple Choice</option>
                      <option>Checkbox</option>
                      <option>Drop-down</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Options */}
                  {(question.format === "Multiple Choice" ||
                    question.format === "Checkbox") && (
                    <>
                      <Form.Label>Options</Form.Label>
                      {question.options.map((option, optIndex) => (
                        <Form.Group key={optIndex} className="mb-2 d-flex">
                          <Form.Control
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const updatedOptions = [...question.options];
                              updatedOptions[optIndex] = e.target.value;
                              handleEditQuestion(
                                index,
                                "options",
                                updatedOptions
                              );
                            }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              const updatedOptions = question.options.filter(
                                (_, i) => i !== optIndex
                              );
                              handleEditQuestion(
                                index,
                                "options",
                                updatedOptions
                              );
                            }}
                          >
                            -
                          </Button>
                        </Form.Group>
                      ))}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          handleEditQuestion(index, "options", [
                            ...question.options,
                            "",
                          ]);
                        }}
                      >
                        + Add Option
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default ManageExam;
