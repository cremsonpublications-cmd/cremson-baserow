from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import csv
import io

from services.question_bank_service import question_bank_service

router = APIRouter()

class BlueprintItem(BaseModel):
    question_type: str
    quantity: int
    marks_each: int

class GeneratePaperRequest(BaseModel):
    paper_type: str = "Chapter Test"
    class_name: str = "Class XII"
    subject: str = "Entrepreneurship"
    chapters: List[str] = []
    test_title: str = "Entrepreneurship Unit Test"
    duration: str = "45 Minutes"
    max_marks: int = 30
    examination_date: Optional[str] = ""
    school_name: Optional[str] = ""
    teacher_name: Optional[str] = ""
    difficulty: str = "Balanced"
    blueprint: List[BlueprintItem]

class ReplaceQuestionRequest(BaseModel):
    current_question_id: str
    chapter: str
    question_type: str
    marks: int

class QuestionSchema(BaseModel):
    class_name: str
    subject: str
    chapter: str
    topic: Optional[str] = ""
    question_type: str
    objective_subtype: Optional[str] = None
    difficulty: str = "Moderate"
    marks: int = 1
    question_text: str
    option_a: Optional[str] = ""
    option_b: Optional[str] = ""
    option_c: Optional[str] = ""
    option_d: Optional[str] = ""
    correct_answer: Optional[str] = ""
    model_answer: Optional[str] = ""
    marking_scheme: Optional[str] = ""
    competency_type: Optional[str] = "Understand"
    source: Optional[str] = "Cremson Question Bank"
    author: Optional[str] = "Cremson Editorial Team"
    academic_session: Optional[str] = "2026-27"
    verification_status: Optional[str] = "Approved"
    active_status: Optional[bool] = True

@router.get("/meta")
def get_metadata():
    return question_bank_service.get_meta()

@router.get("/questions")
def get_questions(
    class_name: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    chapter: Optional[str] = Query(None),
    question_type: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    approved_only: bool = Query(True)
):
    return question_bank_service.list_questions(
        class_name=class_name,
        subject=subject,
        chapter=chapter,
        question_type=question_type,
        difficulty=difficulty,
        search=search,
        approved_only=approved_only
    )

@router.post("/generate")
def generate_paper(req: GeneratePaperRequest):
    return question_bank_service.generate_paper(req.dict())

@router.post("/replace-question")
def replace_question(req: ReplaceQuestionRequest):
    replacement = question_bank_service.replace_question(
        current_question_id=req.current_question_id,
        chapter=req.chapter,
        question_type=req.question_type,
        marks=req.marks
    )
    if not replacement:
        raise HTTPException(
            status_code=444 if False else 404,
            detail="No alternative question matching the required criteria was found in the question bank."
        )
    return replacement

@router.post("/admin/questions")
def add_question(q: QuestionSchema):
    return question_bank_service.add_question(q.dict())

@router.put("/admin/questions/{question_id}")
def update_question(question_id: str, q: QuestionSchema):
    updated = question_bank_service.update_question(question_id, q.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="Question not found")
    return updated

@router.post("/admin/import-csv")
async def import_questions_csv(file: UploadFile = File(...)):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = []
    skipped = []
    
    for row in reader:
        q_text = row.get("question_text", "").strip()
        if not q_text:
            continue
        
        # Check duplicate
        existing = [q for q in question_bank_service.list_questions(approved_only=False) if q["question_text"].strip() == q_text]
        if existing:
            skipped.append({"question_text": q_text, "reason": "Duplicate question text detected"})
            continue
            
        new_q = {
            "class_name": row.get("class", row.get("class_name", "Class XII")),
            "subject": row.get("subject", "Entrepreneurship"),
            "chapter": row.get("chapter", "Entrepreneurial Opportunity"),
            "topic": row.get("topic", ""),
            "question_type": row.get("question_type", "Objective"),
            "objective_subtype": row.get("objective_subtype", None),
            "difficulty": row.get("difficulty", "Moderate"),
            "marks": int(row.get("marks", 1)),
            "question_text": q_text,
            "option_a": row.get("option_a", ""),
            "option_b": row.get("option_b", ""),
            "option_c": row.get("option_c", ""),
            "option_d": row.get("option_d", ""),
            "correct_answer": row.get("correct_answer", ""),
            "model_answer": row.get("model_answer", ""),
            "marking_scheme": row.get("marking_scheme", ""),
            "competency_type": row.get("competency_type", "Understand"),
            "source": row.get("source", "CSV Import"),
            "author": row.get("author", "Admin"),
            "academic_session": row.get("academic_session", "2026-27"),
            "verification_status": row.get("verification_status", "Approved"),
            "active_status": True if row.get("active_status", "Active").lower() in ["active", "true", "1"] else False
        }
        added = question_bank_service.add_question(new_q)
        imported.append(added)

    return {
        "imported_count": len(imported),
        "skipped_count": len(skipped),
        "skipped_details": skipped,
        "imported_questions": imported
    }
