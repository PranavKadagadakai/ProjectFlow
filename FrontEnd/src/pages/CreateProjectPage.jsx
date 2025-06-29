// FrontEnd/src/pages/CreateProjectPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const CreateProjectPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    const projectData = {
      title,
      description,
      start_date: startDate,
      end_date: endDate,
    };

    try {
      await api.post("/api/projects/", projectData);
      setMessage("Project created successfully! Redirecting...");
      setTimeout(() => navigate("/faculty-dashboard"), 2000);
    } catch (error) {
      console.error("Error creating project:", error);
      setIsError(true);
      setMessage(error.response?.data?.detail || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "700px" }}>
        <h2 className="mb-4 text-center">Create New Project</h2>
        {message && (
          <div
            className={`alert ${isError ? "alert-danger" : "alert-success"}`}
            role="alert"
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="projectTitle" className="form-label">
              Project Title
            </label>
            <input
              type="text"
              className="form-control"
              id="projectTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="projectDescription" className="form-label">
              Description
            </label>
            <textarea
              className="form-control"
              id="projectDescription"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="startDate" className="form-label">
                Start Date
              </label>
              <input
                type="date"
                className="form-control"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="endDate" className="form-label">
                End Date
              </label>
              <input
                type="date"
                className="form-control"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectPage;
