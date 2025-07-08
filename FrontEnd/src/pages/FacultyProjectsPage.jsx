import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const FacultyProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get("/api/projects/");
        setProjects(response.data);
      } catch (err) {
        setError("Failed to fetch your projects.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <p>Loading projects...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Projects</h2>
        <Link to="/create-project" className="btn btn-primary">
          Create New Project
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="text-center card p-4">
          <p>You have not created any projects yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.project_id}>
                    <td>{p.title}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          p.is_active ? "success" : "secondary"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{p.end_date}</td>
                    <td>
                      <Link
                        to={`/edit-project/${p.project_id}`}
                        className="btn btn-sm btn-secondary me-2"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/project/${p.project_id}/rubrics`}
                        className="btn btn-sm btn-info"
                      >
                        Rubrics
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyProjectsPage;
