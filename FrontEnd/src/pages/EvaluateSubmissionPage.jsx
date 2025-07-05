// FrontEnd/src/pages/EvaluateSubmissionPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";

const EvaluateSubmissionPage = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const subRes = await api.get(`/api/submissions/${submissionId}/`);
      setSubmission(subRes.data);

      const rubricsRes = await api.get(
        `/api/projects/${subRes.data.project_id}/rubrics/`
      );
      setRubrics(rubricsRes.data);

      const evalsRes = await api.get(
        `/api/submissions/${submissionId}/evaluations/`
      );
      setEvaluations(evalsRes.data);
    } catch (err) {
      setError("Failed to load submission data.");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFinalize = async () => {
    if (
      !window.confirm(
        "Are you sure you want to finalize this evaluation? This will calculate the final score and cannot be undone."
      )
    ) {
      return;
    }
    try {
      await api.post(`/api/submissions/${submissionId}/finalize_evaluation/`);
      alert("Evaluation finalized successfully!");
      fetchData(); // Refresh data to show final scores
    } catch (error) {
      setError(
        error.response?.data?.detail || "Failed to finalize evaluation."
      );
    }
  };

  if (loading) return <p>Loading evaluation details...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!submission) return <p>No submission found.</p>;

  return (
    <div className="container">
      <h2 className="mb-3">Evaluating Submission</h2>
      <div className="card mb-4">
        <div className="card-header">Submission Details</div>
        <div className="card-body">
          <p>
            <strong>Student:</strong> {submission.student_username}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`badge bg-${
                submission.status === "Evaluated" ? "success" : "warning"
              }`}
            >
              {submission.status}
            </span>
          </p>
          {submission.github_link && (
            <p>
              <strong>GitHub:</strong>{" "}
              <a
                href={submission.github_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {submission.github_link}
              </a>
            </p>
          )}
          {submission.youtube_link && (
            <p>
              <strong>YouTube:</strong>{" "}
              <a
                href={submission.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {submission.youtube_link}
              </a>
            </p>
          )}
        </div>
      </div>

      {submission.status === "Evaluated" ? (
        <FinalScores submission={submission} />
      ) : (
        <>
          <ManualEvaluationForm
            rubrics={rubrics}
            evaluations={evaluations}
            submissionId={submissionId}
            onEvaluationSuccess={fetchData}
          />
          <div className="text-center mt-4">
            <button
              className="btn btn-success btn-lg"
              onClick={handleFinalize}
              disabled={evaluations.length < rubrics.length}
            >
              Finalize Evaluation
            </button>
            {evaluations.length < rubrics.length && (
              <p className="text-muted mt-2">
                You must evaluate all criteria before finalizing.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ManualEvaluationForm = ({
  rubrics,
  evaluations,
  submissionId,
  onEvaluationSuccess,
}) => {
  const [points, setPoints] = useState({});
  const [feedback, setFeedback] = useState({});

  const handleScoreChange = (rubricId, value) =>
    setPoints((prev) => ({ ...prev, [rubricId]: value }));
  const handleFeedbackChange = (rubricId, value) =>
    setFeedback((prev) => ({ ...prev, [rubricId]: value }));

  const handleSubmit = async (rubric) => {
    const payload = {
      rubric_id: rubric.rubric_id,
      points_awarded: parseInt(points[rubric.rubric_id], 10),
      feedback: feedback[rubric.rubric_id] || "",
    };
    try {
      await api.post(`/api/submissions/${submissionId}/evaluations/`, payload);
      onEvaluationSuccess(); // Refresh parent component data
    } catch (error) {
      alert(`Error saving evaluation: ${error.response?.data?.detail}`);
    }
  };

  return (
    <div className="card">
      <div className="card-header">Manual Scoring</div>
      <ul className="list-group list-group-flush">
        {rubrics.map((rubric) => {
          const existingEval = evaluations.find(
            (e) => e.rubric_id === rubric.rubric_id
          );
          return (
            <li key={rubric.rubric_id} className="list-group-item">
              <h5>
                {rubric.criterion} ({rubric.max_points} pts)
              </h5>
              <p className="text-muted">{rubric.description}</p>
              {existingEval ? (
                <div className="alert alert-success">
                  <p>
                    <strong>Evaluated:</strong> {existingEval.points_awarded} /{" "}
                    {rubric.max_points} points
                  </p>
                  {existingEval.feedback && (
                    <p>
                      <strong>Feedback:</strong> {existingEval.feedback}
                    </p>
                  )}
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      max={rubric.max_points}
                      min="0"
                      placeholder="Score"
                      onChange={(e) =>
                        handleScoreChange(rubric.rubric_id, e.target.value)
                      }
                    />
                  </div>
                  <div className="col-md-7">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Optional feedback"
                      onChange={(e) =>
                        handleFeedbackChange(rubric.rubric_id, e.target.value)
                      }
                    />
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => handleSubmit(rubric)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const FinalScores = ({ submission }) => (
  <div className="card border-success">
    <div className="card-header bg-success text-white">Final Scores</div>
    <div className="card-body text-center">
      <div className="row">
        <div className="col-md-4">
          <h4>Manual Score</h4>
          <p className="display-6">{submission.manual_score}</p>
        </div>
        <div className="col-md-4">
          <h4>ML-Assisted Score</h4>
          <p className="display-6">{submission.ml_score}</p>
        </div>
        <div className="col-md-4">
          <h4>Overall Weighted Score</h4>
          <p className="display-4 text-success">{submission.overall_score}</p>
        </div>
      </div>
    </div>
  </div>
);

export default EvaluateSubmissionPage;
