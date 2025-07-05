# Project Submission Portal with ML-Based Automated Evaluation

This repository contains the full-stack code for a cloud-native web application designed to facilitate the submission, evaluation, and recognition of academic projects. It features a Python/Django backend integrated with AWS services, a React.js frontend, and a simulated ML model for automated scoring assistance.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)

## Project Overview

The portal allows students to submit project reports and artifacts (like GitHub repositories or video demo). Faculty can then evaluate these submissions both manually and with the assistance of an ML-based automated scoring system. The system includes secure authentication, role-based access, scalable data storage, and a real-time leaderboard that reflects a weighted combination of manual and automated scores.

## Features

- **User Authentication**: Secure user registration and login via AWS Cognito, with multi-factor authentication support.
- **Role-Based Access**: Distinct interfaces and permissions for Students and Faculty/Administrators.
- **Project & Rubric Management**: Faculty can create projects, set submission deadlines, and define detailed evaluation rubrics for each project.
- **Project Submission**: Students can upload project files (PDF, DOCX) and link to external artifacts (GitHub, YouTube), with deadline enforcement.
- **Faculty Evaluation**: A comprehensive interface for faculty to view submissions, provide scores based on rubrics, and write detailed feedback.
- **Automated Evaluation**: An integrated ML model simulation analyzes submission content to provide automated scores for **quality**, **innovation**, and **impact**, assisting faculty in the evaluation process.
- **Combined Scoring**: The final score for a submission is a weighted average of the manual faculty score and the automated ML score.
- **Dynamic Leaderboard**: Displays real-time project rankings based on the final combined scores.
- **Theming**: A user-toggleable light/dark theme for improved usability.
- **Email Notifications**: Automated email confirmations for submissions and evaluation completions using AWS SES.

## Technology Stack

| Component          | Technology/Service                    | Notes                                        |
| :----------------- | :------------------------------------ | :------------------------------------------- |
| **Backend**        | Python, Django, Django REST Framework | API Server                                   |
| **Frontend**       | React.js, Vite, Bootstrap, Axios      | Single-Page Application                      |
| **Database**       | AWS DynamoDB (managed with PynamoDB)  | NoSQL, serverless data storage               |
| **Authentication** | AWS Cognito                           | Managed user pools                           |
| **File Storage**   | AWS S3                                | For project reports and other media uploads  |
| **Email Service**  | AWS SES                               | For automated notifications                  |
| **ML Simulation**  | Python, NLTK                          | Simulates NLP-based evaluation within Django |

## Directory Structure

The project is organized into `BackEnd` and `FrontEnd` directories, with the backend now including a dedicated `ml_evaluator` app.
