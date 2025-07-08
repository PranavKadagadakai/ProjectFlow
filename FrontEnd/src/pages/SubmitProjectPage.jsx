import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { uploadData } from "aws-amplify/storage"; // For S3 uploads
import useAuth from "../hooks/useAuth"; // To get user details for S3 path

const SubmitProjectPage = () => {
  const { user, isAuthenticated } = useAuth(); // Assuming user has 'username'
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    project_id: "",
    title: "", // Student's submission title
    report_content_summary: "", // Text summary for AI evaluation
    github_link: "",
    youtube_link: "",
  });

  const [projectReportFile, setProjectReportFile] = useState(null); // For PDF upload
  const [sourceCodeFile, setSourceCodeFile] = useState(null); // For ZIP upload
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

    let reportFileS3Key = null;
    let sourceCodeFileS3Key = null;

    try {
      // 1. Upload Project Report (PDF) to S3
      if (projectReportFile) {
        const reportFileName = `reports/${user.username}/${Date.now()}-${
          projectReportFile.name
        }`;
        const result = await uploadData({
          path: reportFileName,
          data: projectReportFile,
          options: {
            contentType: projectReportFile.type,
          },
        }).result;
        reportFileS3Key = result.path; // S3 key
        console.log("Project report uploaded:", reportFileS3Key);
      }

      // 2. Upload Source Code (ZIP) to S3
      if (sourceCodeFile) {
        const sourceCodeFileName = `source-code/${
          user.username
        }/${Date.now()}-${sourceCodeFile.name}`;
        const result = await uploadData({
          path: sourceCodeFileName,
          data: sourceCodeFile,
          options: {
            contentType: sourceCodeFile.type,
          },
        }).result;
        sourceCodeFileS3Key = result.path; // S3 key
        console.log("Source code uploaded:", sourceCodeFileS3Key);
      }

      // 3. Prepare data for Django Backend
      const submissionData = {
        project_id: formData.project_id,
        title: formData.title, // Student's specific title for this submission
        report_content_summary: formData.report_content_summary,
        report_file_s3_key: reportFileS3Key, // Pass S3 key if file was uploaded
        github_link: formData.github_link || null, // Pass null if empty
        source_code_file_s3_key: sourceCodeFileS3Key, // Pass S3 key if file was uploaded
        youtube_link: formData.youtube_link || null, // Pass null if empty
      };

      const response = await api.post("/api/submissions/", submissionData);
      setMessage("Project submitted successfully! Redirecting...");
      console.log("Django API response:", response.data);

      // Clear form
      setFormData({
        project_id: "",
        title: "",
        report_content_summary: "",
        github_link: "",
        youtube_link: "",
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
            Submission Title
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
            Project Report (PDF)
          </label>
          <input
            type="file"
            className="form-control"
            id="projectReportFile"
            accept=".pdf"
            onChange={(e) => handleFileChange(e, setProjectReportFile)}
          />
          <div className="form-text">
            Upload your detailed project report as a PDF.
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="report_content_summary" className="form-label">
            Project Report Summary (for AI Evaluation)
          </label>
          <textarea
            className="form-control"
            id="report_content_summary"
            name="report_content_summary"
            rows="8"
            value={formData.report_content_summary}
            onChange={handleChange}
            required
            placeholder="Paste a detailed summary of your project report here. This text will be analyzed by the automated evaluation model."
          ></textarea>
          <div className="form-text">
            Provide a comprehensive summary (min 200 words recommended) of your
            project, including objectives, methodology, results, and
            conclusions.
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="github_link" className="form-label">
            GitHub Repository Link (Optional)
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
            Upload Project Source Code (ZIP) (Optional)
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

        <div className="mb-3">
          <label htmlFor="youtube_link" className="form-label">
            YouTube Demo Video Link (Optional)
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
          <div className="form-text">
            Provide a link to a demo video of your project.
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading || (!formData.github_link && !sourceCodeFile)}
        >
          {loading ? "Submitting..." : "Submit Project"}
        </button>
      </form>
    </div>
  );
};

export default SubmitProjectPage;
