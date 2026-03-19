# 🤖 AI Resume Screening System

An AI-powered resume screening and candidate ranking system that analyzes resumes against job descriptions using advanced LLM technology.

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![AI](https://img.shields.io/badge/AI-Groq%20LLM-orange?logo=openai)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 What It Does

Upload a **Job Description** and **multiple resumes** → Get instant AI-powered analysis:

| Output | Description |
|--------|-------------|
| **Match Score** | 0–100 score based on skills, experience, and qualifications |
| **Candidate Ranking** | Sorted from best to least fit |
| **Key Strengths** | 2–3 specific strengths per candidate |
| **Key Gaps** | 2–3 specific gaps per candidate |
| **Recommendation** | Strong Fit / Moderate Fit / Not Fit |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│            Frontend (HTML/CSS/JS)            │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Upload UI   │  │ Results Dashboard    │  │
│  │ (Drag&Drop) │  │ (Charts + Rankings)  │  │
│  └─────────────┘  └──────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│            Backend (FastAPI)                  │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐  │
│  │ Parser   │ │ AI Engine  │ │ Ranker    │  │
│  │ PDF/TXT  │ │ Groq LLM  │ │ Scoring   │  │
│  └──────────┘ └────────────┘ └───────────┘  │
└──────────────────┬──────────────────────────┘
                   │
            ┌──────▼──────┐
            │  Groq API   │
            │ (Llama 3.3) │
            └─────────────┘
```

---

## 🚀 Quick Setup

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/ai-resume-screener.git
cd ai-resume-screener

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 2. Get Groq API Key (Free)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free
3. Create an API key

### 3. Configure

```bash
cp .env.example .env
# Edit .env and paste your Groq API key
```

### 4. Run

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open **http://localhost:8000** in your browser.

---

## 📂 Project Structure

```
RSA/
├── backend/
│   ├── main.py              # FastAPI app, routes, static serving
│   ├── ai_analyzer.py       # Groq LLM-based screening engine
│   ├── resume_parser.py     # PDF and text file parser
│   └── models.py            # Pydantic schemas
├── frontend/
│   ├── index.html           # Main UI page
│   ├── style.css            # Premium glassmorphic dark theme
│   └── app.js               # Upload logic, API calls, Chart.js
├── sample_data/
│   ├── job_description.txt  # Sample Data Analyst JD
│   └── resumes/             # 8 diverse sample resumes
├── .env.example             # Environment variable template
└── README.md                # This file
```

---

## 🧠 How It Works

1. **Upload** — JD and resumes are uploaded via the web interface
2. **Parse** — `resume_parser.py` extracts text from PDF/TXT files
3. **Analyze** — `ai_analyzer.py` sends each resume + JD to Groq's Llama 3.3 70B model
4. **Score** — AI evaluates skills match, experience relevance, and qualifications (0–100)
5. **Rank** — Candidates are sorted by score with strengths, gaps, and recommendations
6. **Display** — Results shown in interactive dashboard with charts and detail cards

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python) |
| AI Engine | Groq API (Llama 3.3 70B) |
| Resume Parsing | PyPDF2 |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Charts | Chart.js |
| Design | Glassmorphic dark theme |

---

## 📊 Sample Output

Using the included sample data (1 JD + 8 resumes), the system produces:

| Rank | Candidate | Score | Recommendation |
|------|-----------|-------|----------------|
| 1 | Diana Reddy | 92 | Strong Fit |
| 2 | Alice Sharma | 88 | Strong Fit |
| 3 | Fiona Gupta | 82 | Strong Fit |
| 4 | Helen Verma | 68 | Moderate Fit |
| 5 | Bob Patel | 55 | Moderate Fit |
| 6 | Ethan Mehta | 35 | Not Fit |
| 7 | Charlie Kumar | 28 | Not Fit |
| 8 | George Thomas | 18 | Not Fit |

*Scores may vary slightly between runs due to LLM inference.*

---

## ✨ Key Features

- **AI-Powered Analysis** — Uses state-of-the-art Llama 3.3 70B model
- **Multiple File Formats** — Supports PDF and text files
- **Drag & Drop Upload** — Intuitive file upload interface
- **Interactive Dashboard** — Score charts, ranking table, detail cards
- **Batch Processing** — Analyze up to 20 resumes at once
- **Responsive Design** — Works on desktop and mobile
- **Sample Data Included** — Ready to test out of the box

---

## 👤 Author

**Abhinav Kumar**

---

## 📄 License

MIT License — Free to use and modify.
