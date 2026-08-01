from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from pydantic import BaseModel
from pathlib import Path
import json
import re
from datetime import datetime
from services.baserow import BaserowClient
from config import TABLE_IDS

router = APIRouter()
client = BaserowClient()

BLOGS_FILE = Path(__file__).parent.parent / "blogs_data.json"

DEFAULT_BLOGS = [
    {
        "id": 1,
        "title": "CBSE Class 10 Second Board Exam Result Declared: 2026",
        "slug": "cbse-class-10-second-board-exam-result-declared-2026",
        "category": "News",
        "author": "Vidya Jain",
        "published_date": "July 18, 2026",
        "image": "https://www.educart.co/img-cache/https%3A%2F%2Fcdn.prod.website-files.com%2F5f5cf4627107791c0412287b%2F6a69bf8b86ff839e6eb1a9ce_Untitled-March202026at16.19.50-331-ezgif.com-apng-to-avif-converter.avif",
        "excerpt": "On 18th July, 2026 CBSE declared the result of Class 10 second board examination marking the successful completion of the first year of the Two board examination system.",
        "content": """<p>On 18th July, 2026 CBSE declared the result of Class 10 second board examination marking the successful completion of the first year of the Two board examination system.</p>
<h2>Performance Statistics</h2>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #000; color: #fff;">
      <th>Particular</th>
      <th>Number</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Total Candidates Registered</td><td>6,64,027</td></tr>
    <tr><td>Total Candidates Appeared</td><td>6,63,777</td></tr>
    <tr><td>Students who improved their scores</td><td>3,08,095 (59.95%)</td></tr>
    <tr><td>Overall pass percentage</td><td>96.78%</td></tr>
  </tbody>
</table>""",
        "is_published": True,
        "featured": True
    },
    {
        "id": 2,
        "title": "Educart 2026-27 One Shot Question Banks for CBSE Class 10 Launched",
        "slug": "educart-2026-27-one-shot-question-banks-cbse-class-10-launched",
        "category": "Blogs",
        "author": "Cremson Editorial Team",
        "published_date": "July 11, 2026",
        "image": "https://www.educart.co/img-cache/https%3A%2F%2Fcdn.prod.website-files.com%2F5f5cf4627107791c0412287b%2F6a523b4829a68e66177847e2_ezgif-3fbbda8abdcd4f73.avif",
        "excerpt": "Comprehensive 1-shot revision question banks packed with competency-based questions, NCERT solutions, and practice worksheets.",
        "content": "<p>We are thrilled to announce the launch of our updated 2026-27 One Shot Question Banks for CBSE Class 10 students.</p>",
        "is_published": True,
        "featured": False
    }
]


def _slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    return re.sub(r'[\s-]+', '-', text).strip('-')


def _load_blogs_local() -> list:
    if not BLOGS_FILE.exists():
        BLOGS_FILE.write_text(json.dumps(DEFAULT_BLOGS, indent=2))
        return DEFAULT_BLOGS
    try:
        data = json.loads(BLOGS_FILE.read_text())
        return data if isinstance(data, list) else DEFAULT_BLOGS
    except Exception:
        return DEFAULT_BLOGS


def _save_blogs_local(blogs: list) -> None:
    BLOGS_FILE.write_text(json.dumps(blogs, indent=2))


class BlogCreate(BaseModel):
    title: str
    category: str = "News"
    content: str
    excerpt: Optional[str] = None
    image: Optional[str] = None
    author: Optional[str] = "Cremson Editorial"
    published_date: Optional[str] = None
    is_published: Optional[bool] = True
    featured: Optional[bool] = False


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    image: Optional[str] = None
    author: Optional[str] = None
    published_date: Optional[str] = None
    is_published: Optional[bool] = None
    featured: Optional[bool] = None


@router.get("/", summary="List blog/news posts (from Baserow or DB)")
async def list_blogs(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search term"),
    only_published: bool = Query(True, description="Filter out drafts")
):
    table_id = TABLE_IDS.get("blogs", 0)
    if table_id > 0:
        try:
            res = await client.get_rows(table_id, size=100, search=search)
            rows = res.get("results", [])
            items = []
            for r in rows:
                is_pub = r.get("Is_Published", True)
                cat = r.get("Category", {})
                cat_val = cat.get("value") if isinstance(cat, dict) else str(cat or "News")
                
                item = {
                    "id": r.get("id"),
                    "title": r.get("Title", ""),
                    "slug": r.get("Slug") or _slugify(r.get("Title", "")),
                    "category": cat_val,
                    "author": r.get("Author", "Editorial"),
                    "published_date": r.get("Published_Date", ""),
                    "image": r.get("Image", ""),
                    "excerpt": r.get("Excerpt", ""),
                    "content": r.get("Content", ""),
                    "is_published": is_pub,
                    "featured": r.get("Featured", False),
                }
                if only_published and not is_pub:
                    continue
                if category and category.lower() != "all" and item["category"].lower() != category.lower():
                    continue
                items.append(item)
            return items
        except Exception:
            pass

    # Fallback to persistent data store
    blogs = _load_blogs_local()
    if only_published:
        blogs = [b for b in blogs if b.get("is_published", True)]
    if category and category.lower() != "all":
        blogs = [b for b in blogs if b.get("category", "").lower() == category.lower()]
    if search:
        s = search.lower()
        blogs = [b for b in blogs if s in b.get("title", "").lower() or s in b.get("excerpt", "").lower()]
    blogs.sort(key=lambda x: x.get("id", 0), reverse=True)
    return blogs


@router.get("/{identifier}", summary="Get blog post by ID or slug")
async def get_blog(identifier: str):
    table_id = TABLE_IDS.get("blogs", 0)
    if table_id > 0:
        try:
            res = await client.get_rows(table_id, size=100)
            for r in res.get("results", []):
                slug = r.get("Slug") or _slugify(r.get("Title", ""))
                if str(r.get("id")) == identifier or slug == identifier:
                    cat = r.get("Category", {})
                    cat_val = cat.get("value") if isinstance(cat, dict) else str(cat or "News")
                    return {
                        "id": r.get("id"),
                        "title": r.get("Title", ""),
                        "slug": slug,
                        "category": cat_val,
                        "author": r.get("Author", "Editorial"),
                        "published_date": r.get("Published_Date", ""),
                        "image": r.get("Image", ""),
                        "excerpt": r.get("Excerpt", ""),
                        "content": r.get("Content", ""),
                        "is_published": r.get("Is_Published", True),
                        "featured": r.get("Featured", False),
                    }
        except Exception:
            pass

    blogs = _load_blogs_local()
    for blog in blogs:
        if str(blog.get("id")) == identifier or blog.get("slug") == identifier:
            return blog
    raise HTTPException(status_code=404, detail="Blog article not found")


@router.post("/", summary="Create a blog post")
async def create_blog(body: BlogCreate):
    table_id = TABLE_IDS.get("blogs", 0)
    slug = _slugify(body.title)
    if table_id > 0:
        try:
            payload = {
                "Title": body.title,
                "Slug": slug,
                "Category": body.category,
                "Author": body.author or "Cremson Editorial",
                "Published_Date": body.published_date or datetime.now().strftime("%Y-%m-%d"),
                "Image": body.image or "",
                "Excerpt": body.excerpt or "",
                "Content": body.content,
                "Is_Published": body.is_published,
                "Featured": body.featured,
            }
            return await client.create_row(table_id, payload)
        except Exception:
            pass

    blogs = _load_blogs_local()
    new_id = max([b.get("id", 0) for b in blogs], default=0) + 1
    new_blog = {
        "id": new_id,
        "title": body.title,
        "slug": slug,
        "category": body.category,
        "author": body.author or "Cremson Editorial",
        "published_date": body.published_date or datetime.now().strftime("%B %d, %Y"),
        "image": body.image or "",
        "excerpt": body.excerpt or (body.content[:150] + "..."),
        "content": body.content,
        "is_published": body.is_published,
        "featured": body.featured,
    }
    blogs.append(new_blog)
    _save_blogs_local(blogs)
    return new_blog
