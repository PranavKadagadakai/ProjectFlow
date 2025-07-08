import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

const EvaluateSubmissionPage = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [aiScores, setAiScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = useCallback(async () => {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTriggerAI = async () => {
    setAiLoading(true);
    setError("");
    try {
      const res = await api.post(
        `/api/submissions/${submissionId}/trigger_ai_evaluation/`
      );
      setAiScores(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to run AI evaluation.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (
      !window.confirm(
        "Are you sure you want to finalize this evaluation? This will calculate the final score."
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

  if (loading)
    return <div className="text-center">Loading evaluation details...</div>;
  if (error && !aiLoading)
    return <div className="alert alert-danger">{error}</div>;
  if (!submission)
    return <div className="alert alert-warning">No submission found.</div>;

  // Function to format the key into a readable title
  const formatCriterionTitle = (key) => {
    return key
      .replace("_score", "")
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="container">
      <h2 className="mb-3">Evaluating Submission</h2>
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          Submission Details
          <span
            className={`badge bg-${
              submission.status === "Evaluated" ? "success" : "warning"
            }`}
          >
            {submission.status}
          </span>
        </div>
        <div className="card-body">
          <p>
            <strong>Student:</strong> {submission.student_username}
          </p>
          <p>
            <strong>Version:</strong> {submission.version}
          </p>
          <p>
            <strong>Summary:</strong>
          </p>
          <p className="bg-light p-3 rounded">
            {submission.report_content_summary || "No summary provided."}
          </p>
        </div>
      </div>

      {submission.status === "Evaluated" ? (
        <FinalScores submission={submission} />
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-header">AI-Assisted Evaluation</div>
            <div className="card-body">
              {aiScores ? (
                // MODIFICATION START
                <div className="row">
                  {Object.keys(aiScores)
                    .filter((key) => key.endsWith("_score")) // Get only score keys
                    .map((scoreKey) => {
                      const baseName = scoreKey.replace("_score", ""); // e.g., 'ai', 'innovation'
                      const scoreData = aiScores[scoreKey];
                      const feedbackData = aiScores[`${baseName}_feedback`];

                      // Ensure scoreData and feedbackData exist and have a 'value' property
                      const score =
                        typeof scoreData?.value === "number"
                          ? scoreData.value
                          : null;
                      const feedback =
                        typeof feedbackData?.value === "string"
                          ? feedbackData.value
                          : "No feedback provided.";

                      return (
                        <div className="col-md-6 mb-3" key={scoreKey}>
                          {" "}
                          {/* Changed to col-md-6 for better layout with feedback */}
                          <div className="card h-100">
                            {" "}
                            {/* Added card for each criterion */}
                            <div className="card-body">
                              <h5 className="card-title">
                                {formatCriterionTitle(scoreKey)}
                              </h5>
                              <p className="display-6">
                                {score !== null ? score.toFixed(2) : "N/A"}
                              </p>
                              <h6>AI Feedback:</h6>
                              <p className="card-text text-muted">{feedback}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                // MODIFICATION END
                <div className="text-center">
                  <p>
                    Click the button to get an AI-generated score suggestion
                    based on the submission summary.
                  </p>
                  <button
                    className="btn btn-info"
                    onClick={handleTriggerAI}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      "Evaluate with AI"
                    )}
                  </button>
                  {error && aiLoading && (
                    <div className="alert alert-danger mt-3">{error}</div>
                  )}
                </div>
              )}
            </div>
          </div>

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
  const [error, setError] = useState("");

  const handleScoreChange = (rubricId, value) =>
    setPoints((prev) => ({ ...prev, [rubricId]: value }));
  const handleFeedbackChange = (rubricId, value) =>
    setFeedback((prev) => ({ ...prev, [rubricId]: value }));

  const handleSubmit = async (rubric) => {
    setError("");
    const payload = {
      rubric_id: rubric.rubric_id,
      points_awarded: parseInt(points[rubric.rubric_id], 10),
      feedback: feedback[rubric.rubric_id] || "",
    };

    if (isNaN(payload.points_awarded)) {
      alert("Please enter a valid score.");
      return;
    }

    try {
      await api.post(`/api/submissions/${submissionId}/evaluations/`, payload);
      onEvaluationSuccess(); // Refresh parent component data
    } catch (err) {
      setError(
        `Error saving evaluation: ${err.response?.data?.detail || err.message}`
      );
    }
  };

  return (
    <div className="card">
      <div className="card-header">Manual Scoring</div>
      {error && <div className="alert alert-danger m-3">{error}</div>}
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
