"""Resume and document parser supporting PDF and text files."""

import io
from PyPDF2 import PdfReader


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text content from a PDF file."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        text = "\n".join(text_parts).strip()
        if not text:
            raise ValueError("PDF appears to be empty or image-based (no extractable text).")
        return text
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def parse_text(file_bytes: bytes) -> str:
    """Extract text content from a plain text file."""
    try:
        text = file_bytes.decode("utf-8").strip()
        if not text:
            raise ValueError("Text file is empty.")
        return text
    except UnicodeDecodeError:
        try:
            text = file_bytes.decode("latin-1").strip()
            if not text:
                raise ValueError("Text file is empty.")
            return text
        except Exception as e:
            raise ValueError(f"Failed to decode text file: {str(e)}")


def parse_resume(filename: str, file_bytes: bytes) -> str:
    """Auto-detect file format and extract text content.
    
    Supports: .pdf, .txt, .text, .md
    """
    lower_name = filename.lower()
    
    if lower_name.endswith(".pdf"):
        return parse_pdf(file_bytes)
    elif lower_name.endswith((".txt", ".text", ".md")):
        return parse_text(file_bytes)
    else:
        # Try text first, fall back to PDF
        try:
            return parse_text(file_bytes)
        except ValueError:
            try:
                return parse_pdf(file_bytes)
            except ValueError:
                raise ValueError(
                    f"Unsupported file format for '{filename}'. "
                    "Please upload PDF or text files."
                )
