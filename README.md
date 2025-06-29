# Project Submission Portal with ML-Based Automated Evaluation

This repository contains the full-stack code for a cloud-native web application designed to facilitate the submission, evaluation, and recognition of academic projects. It features a Python/Django backend integrated with AWS services and a React.js frontend.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Automated Setup Scripts](#automated-setup-scripts)
  - [Manual Setup Steps](#manual-setup-steps)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)

## Project Overview

[cite_start]The portal allows students to submit project reports and artifacts (like GitHub repositories or video demos)[cite: 40]. [cite_start]Faculty can then evaluate these submissions both manually and with the assistance of an ML-based automated scoring system[cite: 114]. [cite_start]The system includes secure authentication, scalable data storage, and a real-time leaderboard[cite: 127].

## Features

- [cite_start]**User Authentication**: Secure user registration and login via AWS Cognito[cite: 17, 307].
- [cite_start]**Role-Based Access**: Distinct interfaces and permissions for Students and Faculty[cite: 425, 426].
- [cite_start]**Project Submission**: Students can upload project files (PDF, DOCX) and link to external artifacts (GitHub, YouTube)[cite: 262, 263, 299].
- [cite_start]**Faculty Evaluation**: Faculty can view submissions, provide scores, and give textual feedback[cite: 114].
- **Automated Evaluation**: An integrated ML model provides automated scores for quality, innovation, and impact.
- [cite_start]**Dynamic Leaderboard**: Displays real-time project rankings based on combined scores[cite: 127].
- [cite_start]**Theming**: A user-toggleable light/dark theme for improved usability[cite: 346].
- [cite_start]**Email Notifications**: Automated email confirmations for submissions using AWS SES[cite: 99, 100].

## Technology Stack

| Component          | Technology/Service                                                      |
| :----------------- | :---------------------------------------------------------------------- |
| **Backend**        | [cite_start]Python, Django, Django REST Framework [cite: 2]             |
| **Frontend**       | [cite_start]React.js, Vite, Bootstrap, Axios [cite: 3]                  |
| **Database**       | [cite_start]AWS DynamoDB (managed with PynamoDB) [cite: 36, 40, 45, 48] |
| **Authentication** | [cite_start]AWS Cognito [cite: 17]                                      |
| **File Storage**   | [cite_start]AWS S3 [cite: 259]                                          |
| **Email Service**  | [cite_start]AWS SES [cite: 70]                                          |

## Directory Structure

The project is organized into two main parts: `BackEnd` and `FrontEnd`.

Of course. Here are the README.md file and the setup scripts for various operating systems to streamline the project installation process.

README.md
This file provides a comprehensive overview of the project, its structure, and detailed setup instructions.

Markdown

# Project Submission Portal with ML-Based Automated Evaluation

This repository contains the full-stack code for a cloud-native web application designed to facilitate the submission, evaluation, and recognition of academic projects. It features a Python/Django backend integrated with AWS services and a React.js frontend.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Automated Setup Scripts](#automated-setup-scripts)
  - [Manual Setup Steps](#manual-setup-steps)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)

## Project Overview

[cite_start]The portal allows students to submit project reports and artifacts (like GitHub repositories or video demos)[cite: 40]. [cite_start]Faculty can then evaluate these submissions both manually and with the assistance of an ML-based automated scoring system[cite: 114]. [cite_start]The system includes secure authentication, scalable data storage, and a real-time leaderboard[cite: 127].

## Features

- [cite_start]**User Authentication**: Secure user registration and login via AWS Cognito[cite: 17, 307].
- [cite_start]**Role-Based Access**: Distinct interfaces and permissions for Students and Faculty[cite: 425, 426].
- [cite_start]**Project Submission**: Students can upload project files (PDF, DOCX) and link to external artifacts (GitHub, YouTube)[cite: 262, 263, 299].
- [cite_start]**Faculty Evaluation**: Faculty can view submissions, provide scores, and give textual feedback[cite: 114].
- **Automated Evaluation**: An integrated ML model provides automated scores for quality, innovation, and impact.
- [cite_start]**Dynamic Leaderboard**: Displays real-time project rankings based on combined scores[cite: 127].
- [cite_start]**Theming**: A user-toggleable light/dark theme for improved usability[cite: 346].
- [cite_start]**Email Notifications**: Automated email confirmations for submissions using AWS SES[cite: 99, 100].

## Technology Stack

| Component          | Technology/Service                                                      |
| :----------------- | :---------------------------------------------------------------------- |
| **Backend**        | [cite_start]Python, Django, Django REST Framework [cite: 2]             |
| **Frontend**       | [cite_start]React.js, Vite, Bootstrap, Axios [cite: 3]                  |
| **Database**       | [cite_start]AWS DynamoDB (managed with PynamoDB) [cite: 36, 40, 45, 48] |
| **Authentication** | [cite_start]AWS Cognito [cite: 17]                                      |
| **File Storage**   | [cite_start]AWS S3 [cite: 259]                                          |
| **Email Service**  | [cite_start]AWS SES [cite: 70]                                          |

## Directory Structure

The project is organized into two main parts: `BackEnd` and `FrontEnd`.

.
├── BackEnd/ # Contains the Django project and app
│ ├── Proj/ # Django app handling all backend logic
│ ├── ProjectFlow/# Django project settings
│ ├── manage.py
│ └── requirements.txt
└── FrontEnd/ # Contains the React.js application
├── public/
├── src/
├── package.json
└── vite.config.js

Of course. The setup scripts have been updated to automatically generate the necessary .env files with dummy values if they don't already exist. This simplifies the initial setup process.

Here is the full content for the updated README.md and the three setup scripts.

README.md (Updated)
This updated README.md clarifies that the setup scripts will generate the required environment files.

Markdown

# Project Submission Portal with ML-Based Automated Evaluation

This repository contains the full-stack code for a cloud-native web application designed to facilitate the submission, evaluation, and recognition of academic projects. It features a Python/Django backend integrated with AWS services and a React.js frontend.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Automated Setup Scripts](#automated-setup-scripts)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)

## Project Overview

The portal allows students to submit project reports and artifacts (like GitHub repositories or video demos). Faculty can then evaluate these submissions both manually and with the assistance of an ML-based automated scoring system. The system includes secure authentication, scalable data storage, and a real-time leaderboard.

## Features

- **User Authentication**: Secure user registration and login via AWS Cognito.
- **Role-Based Access**: Distinct interfaces and permissions for Students and Faculty.
- **Project Submission**: Students can upload project files (PDF, DOCX) and link to external artifacts (GitHub, YouTube).
- **Faculty Evaluation**: Faculty can view submissions, provide scores, and give textual feedback.
- **Automated Evaluation**: An integrated ML model provides automated scores for quality, innovation, and impact.
- **Dynamic Leaderboard**: Displays real-time project rankings based on combined scores.
- **Theming**: A user-toggleable light/dark theme for improved usability.
- **Email Notifications**: Automated email confirmations for submissions using AWS SES.

## Technology Stack

| Component          | Technology/Service                    |
| :----------------- | :------------------------------------ |
| **Backend**        | Python, Django, Django REST Framework |
| **Frontend**       | React.js, Vite, Bootstrap, Axios      |
| **Database**       | AWS DynamoDB (managed with PynamoDB)  |
| **Authentication** | AWS Cognito                           |
| **File Storage**   | AWS S3                                |
| **Email Service**  | AWS SES                               |

## Directory Structure

The project is organized into two main parts: `BackEnd` and `FrontEnd`.

.
├── BackEnd/ # Contains the Django project and app
│ ├── Proj/ # Django app handling all backend logic
│ ├── ProjectFlow/# Django project settings
│ ├── manage.py
│ └── requirements.txt
└── FrontEnd/ # Contains the React.js application
├── public/
├── src/
├── package.json
└── vite.config.js

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.8+ and `pip`
- Node.js and `npm`
- An AWS account with configured credentials (Access Key ID, Secret Access Key).

## Setup Instructions

### Automated Setup Scripts

For convenience, setup scripts are provided for different operating systems. These scripts will:

1.  Generate dummy `.env` files for the backend and frontend if they don't exist.
2.  Create a Python virtual environment and install all backend dependencies.
3.  Install all frontend Node.js dependencies.
4.  Attempt to create the required DynamoDB tables.

**Run the script for your OS from the root directory of the project:**

- **Linux/macOS**:
  ```bash
  chmod +x setup.sh
  ./setup.sh
  ```
- **Windows (Command Prompt)**:
  ```bat
  setup.bat
  ```
- **Windows (PowerShell)**:
  `powershell
    # You may need to adjust your execution policy first
    Set-ExecutionPolicy Unrestricted -Scope Process
    .\setup.ps1
    `
  **After running the script**, you **MUST** edit the newly created `.env` file in the `BackEnd/` directory to add your actual AWS service details.

## Running the Application

1.  **Start the Backend Server**:

    - Make sure you are in the `BackEnd/` directory with the virtual environment activated.
    - Run the Django development server:

      ```bash
      # On Linux/macOS
      source venv/bin/activate
      python manage.py runserver

      # On Windows
      venv\Scripts\activate
      python manage.py runserver
      ```

    - The backend will be available at `http://127.0.0.1:8000`.

2.  **Start the Frontend Development Server**:
    - Open a **new terminal**.
    - Navigate to the `FrontEnd/` directory.
    - Run the Vite development server:
      ```bash
      npm run dev
      ```
    - The frontend will be available at `http://localhost:5173`. You can now open this URL in your browser.

## API Endpoints

[cite_start]The backend exposes several RESTful API endpoints[cite: 68]. Here are the primary ones:

- [cite_start]`GET /api/projects/`: List all projects[cite: 68].
- [cite_start]`POST /api/projects/`: Create a new project (Faculty only)[cite: 68].
- [cite_start]`POST /api/submissions/`: Create a new submission (Students only)[cite: 68].
- [cite_start]`GET /api/submissions/`: List submissions (Faculty see all, students see their own)[cite: 68].
- [cite_start]`GET /api/leaderboard/`: Get project rankings[cite: 68].
- [cite_start]`POST /api/submissions/<id>/evaluations/`: Submit an evaluation (Faculty only)[cite: 68].
