import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import useAuth from "../hooks/useAuth";

const UserProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/profiles/${username}/`);
        setProfile(response.data);
      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <div className="card shadow-sm">
        <div className="card-body text-center">
          <img
            src={
              profile.profile_picture_url || "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="rounded-circle mb-3"
            width="150"
            height="150"
          />
          <h4 className="card-title">
            {profile.full_name || profile.username}
          </h4>
          <p className="text-muted">@{profile.username}</p>
          <p className="card-text">{profile.bio || "No bio provided."}</p>
          {currentUser?.username === username && (
            <Link to="/profile/edit" className="btn btn-primary">
              Edit Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
