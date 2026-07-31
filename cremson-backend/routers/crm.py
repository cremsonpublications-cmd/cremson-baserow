from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()


# ------------------- SCHOOL ROUTER -------------------
@router.get("/schools", summary="List schools")
async def list_schools(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    return await client.get_rows(
        TABLE_IDS["school"],
        page=page,
        size=size,
        search=search,
    )

@router.get("/schools/{row_id}", summary="Get school details")
async def get_school(row_id: int):
    return await client.get_row(TABLE_IDS["school"], row_id)


# ------------------- TEACHER ROUTER -------------------
@router.get("/teachers", summary="List teachers")
async def list_teachers(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    return await client.get_rows(
        TABLE_IDS["teacher"],
        page=page,
        size=size,
        search=search,
    )

@router.get("/teachers/{row_id}", summary="Get teacher details")
async def get_teacher(row_id: int):
    return await client.get_row(TABLE_IDS["teacher"], row_id)


# ------------------- BOOKS ROUTER -------------------
@router.get("/books", summary="List CRM books catalog")
async def list_crm_books(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    return await client.get_rows(
        TABLE_IDS["books"],
        page=page,
        size=size,
        search=search,
    )

@router.get("/books/{row_id}", summary="Get CRM book details")
async def get_crm_book(row_id: int):
    return await client.get_row(TABLE_IDS["books"], row_id)


# ------------------- SUBJECT ROUTER -------------------
@router.get("/subjects", summary="List subjects")
async def list_subjects(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    return await client.get_rows(
        TABLE_IDS["subject"],
        page=page,
        size=size,
        search=search,
    )

@router.get("/subjects/{row_id}", summary="Get subject details")
async def get_subject(row_id: int):
    return await client.get_row(TABLE_IDS["subject"], row_id)
