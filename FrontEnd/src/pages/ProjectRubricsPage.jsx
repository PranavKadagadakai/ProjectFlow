// FrontEnd/src/pages/ProjectRubricsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";

const ProjectRubricsPage = () => {
  const { projectId } = useParams();
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        const response = await api.get(`/api/projects/${projectId}/rubrics/`);
        setRubrics(response.data);
      } catch (err) {
        setError("Failed to fetch rubrics for this project.");
      } finally {
        setLoading(false);
      }
    };
    fetchRubrics();
  }, [projectId]);

  const totalMaxPoints = rubrics.reduce(
    (sum, rubric) => sum + (rubric.max_points || 0),
    0
  );

  if (loading) return <p>Loading rubrics...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Evaluation Rubrics</h2>
        <Link
          to={`/project/${projectId}/create-rubric`}
          className="btn btn-primary"
        >
          Add New Criterion
        </Link>
      </div>
      {rubrics.length === 0 ? (
        <div className="text-center card p-4">
          <p>No rubrics have been defined for this project yet.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="list-group list-group-flush">
            {rubrics.map((rubric) => (
              <li key={rubric.rubric_id} className="list-group-item">
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">{rubric.criterion}</h5>
                  <small>
                    <strong>{rubric.max_points} points</strong>
                  </small>
                </div>
                <p className="mb-1">{rubric.description}</p>
              </li>
            ))}
          </ul>
          <div className="card-footer text-end">
            <strong>Total Maximum Points: {totalMaxPoints}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectRubricsPage;
