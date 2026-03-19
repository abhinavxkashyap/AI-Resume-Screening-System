"""AI-powered resume screening engine using Groq LLM API."""

import json
import os
import asyncio
from typing import List, Dict, Tuple
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
client = None


def get_client() -> AsyncGroq:
    """Get or initialize the AsyncGroq client."""
    global client
    if client is None:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key or api_key == "your_groq_api_key_here":
            raise ValueError(
                "GROQ_API_KEY not set. Please check your environment variables."
            )
        client = AsyncGroq(api_key=api_key)
    return client


async def analyze_single_resume(jd_text: str, resume_text: str, candidate_name: str) -> Dict:
    """Analyze a single resume against a job description using LLM.
    
    Returns a dict with: score, strengths, gaps, recommendation, summary
    """
    prompt = f"""You are an expert HR recruiter and resume screening specialist. 
Analyze the following resume against the job description and provide a detailed assessment.

## Job Description:
{jd_text}

## Candidate Resume ({candidate_name}):
{resume_text}

## Instructions:
Evaluate the candidate's fit for this role. Provide your assessment in the following JSON format ONLY (no other text):

{{
    "score": <integer 0-100>,
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
    "recommendation": "<Strong Fit | Moderate Fit | Not Fit>",
    "summary": "<2-3 sentence overall assessment>"
}}

## Scoring guidelines:
- 80-100: Strong Fit — candidate meets most/all key requirements
- 50-79: Moderate Fit — candidate meets some requirements but has notable gaps
- 0-49: Not Fit — candidate lacks critical requirements for the role

## Important:
- Be fair and objective
- Base your score on skills match, experience relevance, and qualifications
- Provide specific, actionable strengths and gaps (not generic ones)
- Strengths and gaps should be 2-3 items each, concise (under 15 words each)
- Return ONLY valid JSON, no markdown, no explanations"""

    try:
        groq_client = get_client()
        response = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise HR screening assistant. You ONLY respond with valid JSON. No markdown formatting, no code blocks, no explanations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        result = json.loads(result_text)
        
        # Validate and sanitize
        score = max(0, min(100, int(result.get("score", 0))))
        strengths = result.get("strengths", ["Not evaluated"])[:3]
        gaps = result.get("gaps", ["Not evaluated"])[:3]
        recommendation = result.get("recommendation", "Not Fit")
        if recommendation not in ("Strong Fit", "Moderate Fit", "Not Fit"):
            if score >= 80:
                recommendation = "Strong Fit"
            elif score >= 50:
                recommendation = "Moderate Fit"
            else:
                recommendation = "Not Fit"
        summary = result.get("summary", "Analysis completed.")
        
        return {
            "candidate_name": candidate_name,
            "score": score,
            "strengths": strengths,
            "gaps": gaps,
            "recommendation": recommendation,
            "summary": summary
        }
        
    except json.JSONDecodeError as e:
        return {
            "candidate_name": candidate_name,
            "score": 0,
            "strengths": ["Unable to parse"],
            "gaps": ["Analysis error — retry recommended"],
            "recommendation": "Not Fit",
            "summary": f"Error parsing LLM response: {str(e)}"
        }
    except Exception as e:
        return {
            "candidate_name": candidate_name,
            "score": 0,
            "strengths": ["Unable to evaluate"],
            "gaps": ["Analysis error — retry recommended"],
            "recommendation": "Not Fit",
            "summary": f"Error during analysis: {str(e)}"
        }


async def extract_jd_info(jd_text: str) -> Dict:
    """Extract key information from the job description."""
    prompt = f"""Analyze this job description and extract key information.
Return ONLY valid JSON:

{{
    "job_title": "<extracted or inferred job title>",
    "job_summary": "<1-2 sentence summary of the role>",
    "screening_criteria": ["<criterion 1>", "<criterion 2>", "<criterion 3>", "<criterion 4>", "<criterion 5>"]
}}

Job Description:
{jd_text}"""

    try:
        groq_client = get_client()
        response = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise HR assistant. You ONLY respond with valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content.strip())
        return {
            "job_title": result.get("job_title", "Untitled Position"),
            "job_summary": result.get("job_summary", "No summary available."),
            "screening_criteria": result.get("screening_criteria", [])[:5]
        }
    except Exception:
        return {
            "job_title": "Untitled Position",
            "job_summary": "Could not parse job description.",
            "screening_criteria": []
        }


async def analyze_all_resumes(jd_text: str, resumes: List[Tuple[str, str]]) -> Dict:
    """Analyze all resumes against a JD and return ranked results.
    
    Args:
        jd_text: Job description text
        resumes: List of (candidate_name, resume_text) tuples
    
    Returns:
        Complete screening response dict
    """
    # Process JD and all resumes concurrently
    jd_task = extract_jd_info(jd_text)
    resume_tasks = [
        analyze_single_resume(jd_text, resume_text, candidate_name)
        for candidate_name, resume_text in resumes
    ]
    
    # Wait for all tasks to complete
    gathered_results = await asyncio.gather(jd_task, *resume_tasks)
    
    jd_info = gathered_results[0]
    results = gathered_results[1:]
    
    # Sort by score (highest first)
    results = list(results)
    results.sort(key=lambda x: x["score"], reverse=True)
    
    # Assign ranks
    for i, result in enumerate(results):
        result["rank"] = i + 1
    
    return {
        "job_title": jd_info["job_title"],
        "job_summary": jd_info["job_summary"],
        "total_candidates": len(results),
        "results": results,
        "screening_criteria": jd_info["screening_criteria"]
    }
