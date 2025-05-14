import React, { useState, useEffect } from "react";
import { Container, Card, Table, Form, Image, Row, Col } from "react-bootstrap";
import axios from "axios";

const YourBehavior = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [behaviorData, setBehaviorData] = useState({});

  useEffect(() => {
    const fetchBehaviorLogs = async () => {
      const userData = JSON.parse(localStorage.getItem("userData"));
      const userId = userData?.id;

      try {
        const [logsRes, submissionsRes] = await Promise.all([
          axios.get(
            `http://127.0.0.1:5000/api/get_behavior_logs?user_id=${userId}`
          ),
          axios.get(
            `http://127.0.0.1:5000/api/get_exam_submissions?user_id=${userId}`
          ),
        ]);

        const submittedExamIds = submissionsRes.data.map((s) => s.exam_id);

        const grouped = {};
        logsRes.data.forEach((entry) => {
          if (!submittedExamIds.includes(entry.exam_id)) return;

          if (!grouped[entry.exam_id]) {
            grouped[entry.exam_id] = {
              title: entry.title,
              behaviors: [],
              cheated: false,
            };
          }

          grouped[entry.exam_id].behaviors.push({
            timestamp: new Date(entry.timestamp).toLocaleString(),
            action: entry.warning_type,
            image: entry.image_base64,
            label: entry.classification_label || "Not yet classified",
          });

          if (entry.classification_label === "Cheating") {
            grouped[entry.exam_id].cheated = true;
          }
        });

        setExams(
          Object.entries(grouped).map(([id, exam]) => ({
            id,
            title: exam.title,
          }))
        );
        setBehaviorData(grouped);
      } catch (err) {
        console.error("Failed to fetch logs or submissions", err);
      }
    };

    fetchBehaviorLogs();
  }, []);

  const handleExamSelect = (e) => setSelectedExam(e.target.value);

  const currentData = behaviorData[selectedExam];

  return (
    <Container fluid className="py-4 px-3 px-md-5">
      <h2 className="mb-4 fw-bold text-center text-md-start">
        <i className="bi bi-graph-up-arrow me-2"></i>
        Your Exam Behavior
      </h2>

      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8} xl={6}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Form.Group>
                <Form.Label className="fw-semibold">Select an Exam</Form.Label>
                <Form.Select value={selectedExam} onChange={handleExamSelect}>
                  <option value="">-- Choose an Exam --</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {currentData && (
        <Card className="p-4 shadow-lg border-0">
          <Card.Body>
            <h3 className="text-center fw-bold">{currentData.title}</h3>
            <p
              className={`text-center fw-semibold fs-5 mb-4 ${
                currentData.cheated ? "text-danger" : "text-success"
              }`}
            >
              {currentData.cheated
                ? "❌ Cheating detected by the AI system."
                : "✅ No cheating behavior detected."}
            </p>

            <div className="table-responsive">
              <Table striped bordered hover className="mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Timestamp</th>
                    <th>Behavior</th>
                    <th>Captured Image</th>
                    <th>AI Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.behaviors.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.timestamp}</td>
                      <td>{entry.action}</td>
                      <td className="text-center">
                        {entry.image ? (
                          <Image
                            src={`data:image/jpeg;base64,${entry.image}`}
                            alt="Captured"
                            fluid
                            thumbnail
                            className="shadow-sm"
                            style={{ maxWidth: "100px" }}
                          />
                        ) : (
                          "No Image"
                        )}
                      </td>
                      <td
                        className={`fw-bold text-center ${
                          entry.label === "Cheating"
                            ? "text-danger"
                            : entry.label === "Not Cheating"
                            ? "text-success"
                            : "text-secondary"
                        }`}
                      >
                        {entry.label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default YourBehavior;
