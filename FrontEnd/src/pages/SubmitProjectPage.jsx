import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const SubmitProjectPage = () => {
  const { user, isAuthenticated } = useAuth(); // Assuming user has 'username'
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    project_id: "",
    title: "", // Student's submission title - MANDATORY
    github_link: "",
  });

  const [projectReportFile, setProjectReportFile] = useState(null); // For PDF upload - MANDATORY
  const [sourceCodeFile, setSourceCodeFile] = useState(null); // For ZIP upload - MANDATORY (conditionally)
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

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

  const handleFileChange = (e, setFileState) => {
    setFileState(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    if (!isAuthenticated || !user) {
      setMessage("You must be logged in to submit a project.");
      setIsError(true);
      setLoading(false);
      return;
    }

    if (!formData.project_id) {
      setMessage("Please select a project.");
      setIsError(true);
      setLoading(false);
      return;
    }

    if (!formData.title.trim()) {
      setMessage("Project Title is mandatory.");
      setIsError(true);
      setLoading(false);
      return;
    }

    if (!projectReportFile) {
      setMessage("Project Report (PDF) is mandatory.");
      setIsError(true);
      setLoading(false);
      return;
    }

    // Validation for GitHub link vs. Source Code File
    if (!formData.github_link && !sourceCodeFile) {
      setMessage(
        "Please provide either a GitHub link or upload a source code ZIP file."
      );
      setIsError(true);
      setLoading(false);
      return;
    }
    if (formData.github_link && sourceCodeFile) {
      setMessage(
        "Please provide EITHER a GitHub link OR a source code ZIP file, not both."
      );
      setIsError(true);
      setLoading(false);
      return;
    }

    // Create FormData object to send files to Django backend
    const data = new FormData();
    data.append("project_id", formData.project_id);
    data.append("title", formData.title);
    // UPDATED: Explicitly pass filename for report file
    data.append("report_file", projectReportFile, projectReportFile.name);

    if (formData.github_link) {
      data.append("github_link", formData.github_link);
    }
    if (sourceCodeFile) {
      // UPDATED: Explicitly pass filename for source code file
      data.append("source_code_file", sourceCodeFile, sourceCodeFile.name);
    }

    try {
      // Send FormData with files to the backend
      const response = await api.post("/api/submissions/", data, {
        headers: {
          "Content-Type": "multipart/form-data", // Important for file uploads
        },
      });

      setMessage("Project submitted successfully! Redirecting...");
      console.log("Django API response:", response.data);

      // Clear form
      setFormData({
        project_id: "",
        title: "",
        github_link: "",
      });
      setProjectReportFile(null);
      setSourceCodeFile(null);
      // Clear file inputs visually
      document.getElementById("projectReportFile").value = "";
      document.getElementById("sourceCodeFile").value = "";

      setTimeout(() => navigate("/my-submissions"), 2000);
    } catch (error) {
      console.error("Submission error:", error);
      setIsError(true);
      setMessage(
        error.response?.data?.detail ||
          error.message ||
          "Failed to submit project."
      );
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
          {projects.length === 0 && !loading && (
            <p className="text-muted mt-2">
              No active projects available for submission.
            </p>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="title" className="form-label">
            Project Title (for your submission)
          </label>
          <input
            type="text"
            className="form-control"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., My Innovative Project for Course X"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="projectReportFile" className="form-label">
            Project Report (PDF) <span className="text-danger">*</span>
          </label>
          <input
            type="file"
            className="form-control"
            id="projectReportFile"
            accept=".pdf"
            onChange={(e) => handleFileChange(e, setProjectReportFile)}
            required // Made mandatory
          />
          <div className="form-text">
            Upload your detailed project report as a PDF. This will be used for
            evaluation.
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="github_link" className="form-label">
            GitHub Repository Link (Mandatory if no ZIP file)
          </label>
          <input
            type="url"
            className="form-control"
            id="github_link"
            name="github_link"
            value={formData.github_link}
            onChange={handleChange}
            placeholder="https://github.com/your-username/your-repo"
            disabled={!!sourceCodeFile} // Disable if source code file is selected
          />
          <div className="form-text">
            Provide a link to your public GitHub repository.
          </div>
        </div>

        <div className="mb-3 text-center">
          <span className="text-muted">OR</span>
        </div>

        <div className="mb-3">
          <label htmlFor="sourceCodeFile" className="form-label">
            Upload Project Source Code (ZIP) (Mandatory if no GitHub URL)
          </label>
          <input
            type="file"
            className="form-control"
            id="sourceCodeFile"
            accept=".zip"
            onChange={(e) => handleFileChange(e, setSourceCodeFile)}
            disabled={!!formData.github_link} // Disable if GitHub link is provided
          />
          <div className="form-text">
            Upload your project's source code as a .zip file.
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={
            loading ||
            (!formData.github_link && !sourceCodeFile) ||
            !projectReportFile ||
            !formData.title.trim()
          }
        >
          {loading ? "Submitting..." : "Submit Project"}
        </button>
      </form>
    </div>
  );
};

export default SubmitProjectPage;
