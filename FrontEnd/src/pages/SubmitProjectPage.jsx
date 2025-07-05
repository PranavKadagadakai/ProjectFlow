// FrontEnd/src/pages/SubmitProjectPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const SubmitProjectPage = () => {
  const [formData, setFormData] = useState({
    project_id: "",
    report_content_summary: "",
    github_link: "",
    youtube_link: "",
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get("/api/projects/");
        setProjects(response.data.filter((p) => p.is_active));
      } catch (error) {
        setIsError(true);
        setMessage("Failed to load available projects.");
      }
    };
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    if (!formData.project_id) {
      setMessage("Please select a project.");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/submissions/", formData);
      setMessage("Project submitted successfully! Redirecting...");
      setTimeout(() => navigate("/my-submissions"), 2000);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.detail || "Failed to submit project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "700px" }}>
      <h2 className="mb-4 text-center">Submit Project</h2>
      {message && (
        <div className={`alert ${isError ? "alert-danger" : "alert-success"}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="project_id" className="form-label">
            Select Project
          </label>
          <select
            className="form-select"
            id="project_id"
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Choose a Project --</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="report_content_summary" className="form-label">
            Project Report/Summary
          </label>
          <textarea
            className="form-control"
            id="report_content_summary"
            name="report_content_summary"
            rows="8"
            value={formData.report_content_summary}
            onChange={handleChange}
            required
            placeholder="Paste the text of your project report or a detailed summary here. This content will be analyzed by the automated evaluation model."
          ></textarea>
          <div className="form-text">
            Note: File uploads are handled via S3 and not implemented in this
            simplified form. This text area serves for the ML simulation.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="github_link" className="form-label">
            GitHub Repository Link
          </label>
          <input
            type="url"
            className="form-control"
            id="github_link"
            name="github_link"
            value={formData.github_link}
            onChange={handleChange}
            placeholder="https://github.com/user/repo"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="youtube_link" className="form-label">
            YouTube Demo Link
          </label>
          <input
            type="url"
            className="form-control"
            id="youtube_link"
            name="youtube_link"
            value={formData.youtube_link}
            onChange={handleChange}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Project"}
        </button>
      </form>
    </div>
  );
};

export default SubmitProjectPage;
