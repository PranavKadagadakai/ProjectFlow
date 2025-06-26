import React, { useState } from "react";
import { uploadData } from "aws-amplify/storage"; // For S3 uploads
import api from "../api/api"; // Your Axios API instance
import useAuth from "../hooks/useAuth"; // To get user details for submission

const SubmissionForm = () => {
  const { user, isAuthenticated } = useAuth(); // Assuming user has 'username' and 'email'
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectReport, setProjectReport] = useState(null); // For file input
  const [githubLink, setGithubLink] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [demoVideo, setDemoVideo] = useState(null); // For file input

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleFileChange = (e, setFile) => {
    setFile(e.target.files[0]);
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

    // You'll need to fetch the available projects and allow the user to select one
    // For this example, let's assume a project ID (e.g., project 1) for demonstration.
    // In a real app, you'd have a dropdown to select an active project.
    const projectId = 1; // REPLACE WITH ACTUAL PROJECT SELECTION LOGIC

    let reportFileKey = null;
    let demoVideoFileKey = null;

    try {
      // 1. Upload Project Report to S3
      if (projectReport) {
        const reportFileName = `reports/${user.username}/${Date.now()}-${
          projectReport.name
        }`;
        const result = await uploadData({
          path: reportFileName,
          data: projectReport,
          options: {
            contentType: projectReport.type,
          },
        }).result;
        reportFileKey = result.path; // S3 key
        console.log("Project report uploaded:", reportFileKey);
      }

      // 2. Upload Demo Video to S3
      if (demoVideo) {
        const videoFileName = `videos/${user.username}/${Date.now()}-${
          demoVideo.name
        }`;
        const result = await uploadData({
          path: videoFileName,
          data: demoVideo,
          options: {
            contentType: demoVideo.type,
          },
        }).result;
        demoVideoFileKey = result.path; // S3 key
        console.log("Demo video uploaded:", demoVideoFileKey);
      }

      // 3. Submit Project Data to Django Backend
      const submissionData = {
        project: projectId,
        title: title,
        description: description,
        report_file: reportFileKey, // Pass S3 key for Django to store
        github_link: githubLink,
        youtube_link: youtubeLink,
        demo_video_file: demoVideoFileKey, // Pass S3 key for Django to store
      };

      const response = await api.post("/api/submissions/", submissionData);
      setMessage("Project submitted successfully!");
      console.log("Django API response:", response.data);

      // Clear form
      setTitle("");
      setDescription("");
      setProjectReport(null);
      setGithubLink("");
      setYoutubeLink("");
      setDemoVideo(null);
      document.getElementById("projectReportFile").value = ""; // Clear file input visually
      document.getElementById("demoVideoFile").value = ""; // Clear file input visually
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
    <div className="container mt-5">
      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "700px" }}>
        <h2 className="mb-4 text-center text-dark">Submit Your Project</h2>
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
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="mb-3">
            <label htmlFor="projectReportFile" className="form-label">
              Project Report (PDF/DOCX)
            </label>
            <input
              type="file"
              className="form-control"
              id="projectReportFile"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileChange(e, setProjectReport)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="githubLink" className="form-label">
              GitHub Repository Link
            </label>
            <input
              type="url"
              className="form-control"
              id="githubLink"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="youtubeLink" className="form-label">
              YouTube Demo Video Link
            </label>
            <input
              type="url"
              className="form-control"
              id="youtubeLink"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="demoVideoFile" className="form-label">
              Upload Demo Video (MP4/AVI)
            </label>
            <input
              type="file"
              className="form-control"
              id="demoVideoFile"
              accept=".mp4,.avi"
              onChange={(e) => handleFileChange(e, setDemoVideo)}
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
    </div>
  );
};

export default SubmissionForm;
