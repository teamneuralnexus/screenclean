# AI Resume Screener

An intelligent resume screening application built with Nuxt 3 and TailwindCSS that helps recruiters and hiring managers efficiently evaluate job applications using AI.

## Overview

AI Resume Screener automates the initial review process of job applications by analyzing resumes against job descriptions, required skills, and custom screening criteria. The app provides objective scoring, skill matching, and recommendations to streamline your hiring workflow.

## Features

- **Automated Resume Analysis**: Extract and analyze text from uploaded resumes
- **AI-Powered Evaluation**: Compare resumes against job requirements using advanced AI
- **Smart Scoring System**: Get objective match scores (0-100) for each application
- **Skill Matching**: Identify which required skills appear in candidate resumes
- **Status Tracking**: Follow applications through the entire hiring pipeline
- **User-Friendly Dashboard**: Manage job listings and applicants in one place
- **Real-time Feedback**: Get instant compatibility assessments when reviewing applications

## Tech Stack

- **Frontend**: Nuxt 3, Vue.js, TailwindCSS
- **Backend**: Node.js, PostgreSQL
- **AI Integration**: Gemini API
- **Document Processing**: office-text-extractor

## Setup

### Prerequisites

- Node.js (v16 or newer)
- PostgreSQL database
- Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-resume-screener.git
cd ai-resume-screener
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/resume_screener
GEMINI_API_KEY=your_gemini_api_key
```

4. Set up the database:
```bash
# Import schema
psql -U your_db_user -d your_db_name -f db/schema.sql
```

5. Start the development server:
```bash
npm run dev
```

## Usage

1. **Create Job Listings**: Add job details, required skills, and screening criteria
2. **Receive Applications**: Candidates upload resumes and provide information
3. **Automatic Processing**: The system extracts text and analyzes applications
4. **Review Results**: View match scores, skill matches, and recommendations
5. **Make Decisions**: Sort qualified candidates into interview, review, or reject categories

## Scheduled Processing

The application includes a cron job that automatically processes pending applications in the background. This ensures all applications are evaluated even during high-volume periods.

## Development

### Project Structure
- `components/`: Vue components including `ApplicantsList.vue`, `DashboardNav.vue`, etc.
- `composables/`: Reusable Vue composition functions
- `pages/`: Application routes and pages
- `server/`: API endpoints and server-side logic
- `db/`: Database schema and migrations

### Key Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Production preview
npm run preview
```

## License

[MIT License](LICENSE)