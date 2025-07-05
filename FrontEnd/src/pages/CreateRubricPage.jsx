// FrontEnd/src/pages/CreateRubricPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const CreateRubricPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    criterion: "",
    max_points: 10,
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      await api.post(`/api/projects/${projectId}/rubrics/`, formData);
      setMessage("Rubric criterion added successfully!");
      // Optionally clear form or redirect
      setTimeout(() => {
        navigate(`/project/${projectId}/rubrics`);
      }, 1500);
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.detail || "Failed to add rubric criterion."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "600px" }}>
      <h2 className="mb-4 text-center">Add Rubric Criterion</h2>
      <p className="text-center text-muted">For Project ID: {projectId}</p>
      {message && (
        <div className={`alert ${isError ? "alert-danger" : "alert-success"}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="criterion" className="form-label">
            Criterion Name
          </label>
          <input
            type="text"
            name="criterion"
            id="criterion"
            className="form-control"
            value={formData.criterion}
            onChange={handleChange}
            placeholder="e.g., Innovation"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="max_points" className="form-label">
            Max Points
          </label>
          <input
            type="number"
            name="max_points"
            id="max_points"
            className="form-control"
            value={formData.max_points}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows="3"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            placeholder="Briefly describe what this criterion measures."
          ></textarea>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Criterion"}
        </button>
      </form>
    </div>
  );
};

export default CreateRubricPage;
