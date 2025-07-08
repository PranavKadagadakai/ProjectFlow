import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const EditProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/api/projects/${projectId}/`);
        setFormData(response.data);
      } catch (err) {
        setError("Failed to load project data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.put(`/api/projects/${projectId}/`, formData);
      setMessage("Project updated successfully!");
      setTimeout(() => navigate("/my-projects"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update project.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.title) return <p>Loading project...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "700px" }}>
      <h2 className="mb-4 text-center">Edit Project</h2>
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit}>
        {/* Form fields for title, description, dates, is_active */}
        <div className="mb-3">
          <label htmlFor="title" className="form-label">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            className="form-control"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        {/* ... other fields ... */}
        <div className="form-check form-switch mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="is_active">
            Project is Active
          </label>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditProjectPage;
