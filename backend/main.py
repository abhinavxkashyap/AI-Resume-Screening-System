"""FastAPI application for AI Resume Screening System."""

import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from backend.resume_parser import parse_resume
from backend.ai_analyzer import analyze_all_resumes
from backend.models import ScreeningResponse

# Resolve paths
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="AI Resume Screening System",
    description="AI-powered resume screening and candidate ranking system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "AI Resume Screening System is running"}


@app.get("/api/test_groq")
async def test_groq():
    """Test Groq connectivity."""
    try:
        from backend.ai_analyzer import get_client
        client = get_client()
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say 'hello world' and nothing else."}],
            max_tokens=10
        )
        return {"status": "success", "message": response.choices[0].message.content}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}


@app.post("/api/analyze", response_model=ScreeningResponse)
async def analyze_resumes(
    job_description: UploadFile = File(..., description="Job Description file (PDF or TXT)"),
    resumes: List[UploadFile] = File(..., description="Resume files (PDF or TXT)")
):
    """Analyze multiple resumes against a job description.
    
    Accepts a job description file and multiple resume files.
    Returns ranked candidates with scores, strengths, gaps, and recommendations.
    """
    # Validate inputs
    if not resumes:
        raise HTTPException(status_code=400, detail="At least one resume file is required.")
    
    if len(resumes) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 resumes per batch.")
    
    # Parse job description
    try:
        jd_bytes = await job_description.read()
        jd_text = parse_resume(job_description.filename, jd_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Error parsing job description: {str(e)}")
    
    # Parse all resumes
    parsed_resumes = []
    errors = []
    for resume_file in resumes:
        try:
            resume_bytes = await resume_file.read()
            resume_text = parse_resume(resume_file.filename, resume_bytes)
            # Extract candidate name from filename
            name = Path(resume_file.filename).stem
            # Clean up the name
            name = name.replace("_", " ").replace("-", " ")
            # Remove common prefixes like "resume_01_"
            parts = name.split()
            cleaned_parts = []
            for part in parts:
                if part.lower() in ("resume", "cv", "curriculum", "vitae"):
                    continue
                if part.isdigit() or (len(part) == 2 and part[0] == "0" and part[1].isdigit()):
                    continue
                cleaned_parts.append(part.title())
            candidate_name = " ".join(cleaned_parts) if cleaned_parts else name.title()
            
            parsed_resumes.append((candidate_name, resume_text))
        except ValueError as e:
            errors.append(f"{resume_file.filename}: {str(e)}")
    
    if not parsed_resumes:
        raise HTTPException(
            status_code=400,
            detail=f"No resumes could be parsed. Errors: {'; '.join(errors)}"
        )
    
    # Run AI analysis
    try:
        results = await analyze_all_resumes(jd_text, parsed_resumes)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}. Please check your GROQ_API_KEY."
        )
    
    # Add any parsing errors to response
    if errors:
        results["parsing_errors"] = errors
    
    return JSONResponse(content=results)


# Serve frontend static files
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.get("/")
async def serve_frontend():
    """Serve the frontend HTML page."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "Frontend not found. API is running at /api/health"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
