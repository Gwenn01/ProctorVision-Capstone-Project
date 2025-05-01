import React, { useState, useEffect } from "react";
import { Container, Card, Table, Form, Image } from "react-bootstrap";
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
          // Only include logs for submitted exams
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

  const handleExamSelect = (e) => {
    setSelectedExam(e.target.value);
  };

  const currentData = behaviorData[selectedExam];

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Your Exam Behavior</h2>

      <Form.Group className="mb-3">
        <Form.Label>Select Exam</Form.Label>
        <Form.Select value={selectedExam} onChange={handleExamSelect}>
          <option value="">-- Select an Exam --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {currentData && (
        <Card className="p-3 shadow-lg">
          <Card.Body>
            <h3 className="text-center">{currentData.title}</h3>
            <p
              className={`text-center fw-bold ${
                currentData.cheated ? "text-danger" : "text-success"
              }`}
            >
              {currentData.cheated
                ? "Cheating detected by AI."
                : "No cheating behavior detected."}
            </p>

            <Table striped bordered hover responsive>
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
                    <td>
                      {entry.image ? (
                        <Image
                          src={`data:image/jpeg;base64,${entry.image}`}
                          alt="Captured"
                          width={120}
                          thumbnail
                          className="shadow-sm"
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td
                      className={
                        entry.label === "Cheating"
                          ? "text-danger fw-bold"
                          : entry.label === "Not Cheating"
                          ? "text-success fw-bold"
                          : "text-secondary"
                      }
                    >
                      {entry.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default YourBehavior;
