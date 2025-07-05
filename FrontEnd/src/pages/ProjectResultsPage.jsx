// FrontEnd/src/pages/ProjectResultsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

const ProjectResultsPage = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subRes = await api.get(`/api/submissions/${submissionId}/`);
        setSubmission(subRes.data);
        const evalRes = await api.get(
          `/api/submissions/${submissionId}/evaluations/`
        );
        setEvaluations(evalRes.data);
      } catch (err) {
        setError("Failed to load results.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  if (loading) return <p>Loading results...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!submission) return <p>No submission data found.</p>;

  return (
    <div className="container">
      <h2 className="text-center mb-4">Evaluation Results</h2>

      <div className="row justify-content-center mb-4">
        <div className="col-md-4 text-center">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Manual Score</h5>
              <p className="display-6">{submission.manual_score}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-center">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">ML-Assisted Score</h5>
              <p className="display-6">{submission.ml_score}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-center">
          <div className="card bg-light border-primary h-100">
            <div className="card-body">
              <h5 className="card-title text-primary">Final Weighted Score</h5>
              <p className="display-4 text-primary">
                {submission.overall_score}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4>Detailed Feedback</h4>
        </div>
        <ul className="list-group list-group-flush">
          {evaluations.length > 0 ? (
            evaluations.map((ev) => (
              <li key={ev.evaluation_id} className="list-group-item">
                <h5>
                  {ev.rubric.criterion}: {ev.points_awarded} /{" "}
                  {ev.rubric.max_points}
                </h5>
                {ev.feedback && (
                  <p className="mb-0 fst-italic">"{ev.feedback}"</p>
                )}
              </li>
            ))
          ) : (
            <li className="list-group-item">No detailed feedback provided.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProjectResultsPage;
