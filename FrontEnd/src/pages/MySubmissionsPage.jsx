// FrontEnd/src/pages/MySubmissionsPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const MySubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMySubmissions = async () => {
      try {
        const response = await api.get("/api/submissions/my-submissions/");
        setSubmissions(response.data);
      } catch (err) {
        setError("Failed to fetch your submissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchMySubmissions();
  }, []);

  if (loading) return <p>Loading your submissions...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">My Submissions</h2>
      {submissions.length === 0 ? (
        <div className="text-center">
          <p>You have not made any submissions yet.</p>
          <Link to="/submit-project" className="btn btn-primary">
            Submit a Project
          </Link>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Project ID</th>
                    <th>Submitted At</th>
                    <th>Status</th>
                    <th>Overall Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.submission_id}>
                      <td>{sub.project_id}</td>
                      <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            sub.status === "Evaluated" ? "success" : "secondary"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td>{sub.overall_score ?? "N/A"}</td>
                      <td>
                        {sub.status === "Evaluated" && (
                          <Link
                            to={`/results/${sub.submission_id}`}
                            className="btn btn-info btn-sm"
                          >
                            View Results
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySubmissionsPage;
