import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import useAuth from "../hooks/useAuth";

const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    profile_picture_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const response = await api.get(`/api/profiles/${user.username}/`);
          setFormData({
            full_name: response.data.full_name || "",
            bio: response.data.bio || "",
            profile_picture_url: response.data.profile_picture_url || "",
          });
        } catch (err) {
          setError("Failed to load profile data.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.put(`/api/profiles/${user.username}/`, formData);
      setMessage("Profile updated successfully!");
      setTimeout(() => navigate(`/profile/${user.username}`), 1500);
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>You must be logged in to edit your profile.</p>;
  if (loading && !formData.full_name) return <p>Loading profile...</p>;

  return (
    <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "600px" }}>
      <h2 className="text-center mb-4">Edit Your Profile</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="full_name" className="form-label">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            id="full_name"
            className="form-control"
            value={formData.full_name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="bio" className="form-label">
            Bio
          </label>
          <textarea
            name="bio"
            id="bio"
            rows="3"
            className="form-control"
            value={formData.bio}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="mb-3">
          <label htmlFor="profile_picture_url" className="form-label">
            Profile Picture URL
          </label>
          <input
            type="url"
            name="profile_picture_url"
            id="profile_picture_url"
            className="form-control"
            value={formData.profile_picture_url}
            onChange={handleChange}
          />
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

export default EditProfilePage;
