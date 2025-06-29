// FrontEnd/src/pages/FacultySubmissionsView.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const FacultySubmissionsView = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        [cite_start]; // The backend automatically returns all submissions for faculty users [cite: 93]
        const response = await api.get("/api/submissions/");
        setSubmissions(response.data);
      } catch (err) {
        setError("Failed to load submissions.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">All Student Submissions</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Project ID</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <tr key={sub.submission_id}>
                      <td>{sub.student_username}</td>
                      <td>{sub.project_id}</td>
                      <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            sub.status === "evaluated" ? "success" : "warning"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/evaluate-submission/${sub.submission_id}`}
                          className="btn btn-primary btn-sm"
                        >
                          View & Evaluate
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No submissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultySubmissionsView;
