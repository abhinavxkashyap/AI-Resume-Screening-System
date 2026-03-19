"""Pydantic models for API request/response schemas."""

from pydantic import BaseModel
from typing import List, Optional


class CandidateResult(BaseModel):
    """Result of screening a single candidate's resume against a JD."""
    rank: int
    candidate_name: str
    score: int  # 0-100
    strengths: List[str]  # 2-3 key strengths
    gaps: List[str]  # 2-3 key gaps
    recommendation: str  # "Strong Fit" | "Moderate Fit" | "Not Fit"
    summary: str  # Brief overall summary


class ScreeningResponse(BaseModel):
    """Complete screening response with all candidates ranked."""
    job_title: str
    job_summary: str
    total_candidates: int
    results: List[CandidateResult]
    screening_criteria: List[str]  # Key criteria extracted from JD
