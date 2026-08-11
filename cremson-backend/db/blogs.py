import sqlite3
import os

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "blogs.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_blogs_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            image TEXT NOT NULL,
            author TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Published',
            pdf_url TEXT,
            pdf_name TEXT
        )
    """)
    
    # Run migration check for pdf and likes columns
    cursor.execute("PRAGMA table_info(blogs)")
    columns = [col[1] for col in cursor.fetchall()]
    if "pdf_url" not in columns:
        cursor.execute("ALTER TABLE blogs ADD COLUMN pdf_url TEXT")
    if "pdf_name" not in columns:
        cursor.execute("ALTER TABLE blogs ADD COLUMN pdf_name TEXT")
    if "likes" not in columns:
        cursor.execute("ALTER TABLE blogs ADD COLUMN likes INTEGER DEFAULT 0")
    conn.commit()
    
    # Check if table is empty
    cursor.execute("SELECT COUNT(*) FROM blogs")
    if cursor.fetchone()[0] == 0:
        initial_blogs = [
            (
                "embracing-modern-learning-methodologies-in-2026",
                "Embracing Modern Learning Methodologies in 2026",
                "Education",
                "https://res.cloudinary.com/dkxxa3xt0/image/upload/v1785568000/education_banner.jpg",
                "Cremson Education Team",
                "Published on August 1st 2026",
                "How interactive tools and modern curricula are reshaping student success.",
                "<h1>Embracing Modern Learning Methodologies in 2026</h1><p>Education is no longer confined to traditional rote learning. In 2026, interactive textbooks, digital libraries, and smart assessment tools are paving the way for personalized learning journeys. At Cremson Publications, we are committed to building materials that align with these modern paradigms, preparing students for real-world challenges.</p>",
                "Published"
            ),
            (
                "mastering-serverless-apis-with-fastapi-and-sqlite",
                "Mastering Serverless APIs with FastAPI and SQLite",
                "Technology",
                "https://res.cloudinary.com/dkxxa3xt0/image/upload/v1785568001/technology_banner.jpg",
                "Tech Team",
                "Published on July 28th 2026",
                "Building ultra-fast, lightweight, and scalable backend applications.",
                "<h1>Mastering Serverless APIs with FastAPI and SQLite</h1><p>FastAPI has become the standard for building clean, high-performance REST APIs in Python. When combined with SQLite for lightweight, self-contained database storage, it provides an exceptionally quick start for development, prototyping, and small-scale deployment without the overhead of heavy database servers.</p>",
                "Published"
            ),
            (
                "the-lean-launchpad-how-to-validate-your-idea-fast",
                "The Lean Launchpad: How to Validate Your Idea Fast",
                "Startup",
                "https://res.cloudinary.com/dkxxa3xt0/image/upload/v1785568002/startup_banner.jpg",
                "Growth Specialist",
                "Published on July 15th 2026",
                "Minimize waste, maximize feedback, and find your product-market fit.",
                "<h1>The Lean Launchpad: How to Validate Your Idea Fast</h1><p>Starting a business requires validation before heavy investments are made. By deploying lean MVPs (Minimum Viable Products), engaging in customer interviews, and iterating based on real user feedback, founders can pivot quickly and align their product directly with market demand.</p>",
                "Published"
            )
        ]
        
        cursor.executemany("""
            INSERT INTO blogs (slug, title, category, image, author, date, description, content, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_blogs)
        conn.commit()
        
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blog_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)

    # Check if blog_categories table is empty
    cursor.execute("SELECT COUNT(*) FROM blog_categories")
    if cursor.fetchone()[0] == 0:
        default_categories = [
            ("Education",),
            ("Technology",),
            ("Startup",),
            ("Lifestyle",),
            ("Finance",)
        ]
        cursor.executemany("INSERT INTO blog_categories (name) VALUES (?)", default_categories)
        conn.commit()

    # Check if we need to migrate/recreate the study_materials table
    cursor.execute("PRAGMA table_info(study_materials)")
    columns = [row[1] for row in cursor.fetchall()]
    if len(columns) > 0 and "parent_id" not in columns:
        cursor.execute("DROP TABLE study_materials")
        conn.commit()

    # Create study_materials table with hierarchical/parent-child support
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER DEFAULT NULL,
            label TEXT NOT NULL,
            url TEXT DEFAULT NULL,
            FOREIGN KEY(parent_id) REFERENCES study_materials(id) ON DELETE CASCADE
        )
    """)
    conn.commit()

    # Create teaching_resources table with hierarchical/parent-child support
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teaching_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER DEFAULT NULL,
            label TEXT NOT NULL,
            url TEXT DEFAULT NULL,
            FOREIGN KEY(parent_id) REFERENCES teaching_resources(id) ON DELETE CASCADE
        )
    """)
    conn.commit()

    # Create study_material_posts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_material_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            image TEXT NOT NULL,
            author TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Published',
            pdf_url TEXT,
            pdf_name TEXT
        )
    """)
    conn.commit()

    # Create study_material_categories table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_material_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)
    conn.commit()

    # Seed study_material_categories if empty
    cursor.execute("SELECT COUNT(*) FROM study_material_categories")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("INSERT INTO study_material_categories (name) VALUES (?)", [
            ("CBSE",),
            ("ICSE",),
            ("State Board",),
            ("Nursery",),
            ("Primary Classes",),
            ("Secondary Classes",)
        ])
        conn.commit()

    # Create teaching_resource_posts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teaching_resource_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            image TEXT NOT NULL,
            author TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Published',
            pdf_url TEXT,
            pdf_name TEXT
        )
    """)
    conn.commit()

    # Create teaching_resource_categories table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teaching_resource_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)
    conn.commit()

    # Seed teaching_resource_categories if empty
    cursor.execute("SELECT COUNT(*) FROM teaching_resource_categories")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("INSERT INTO teaching_resource_categories (name) VALUES (?)", [
            ("Lesson Plans",),
            ("Worksheets",),
            ("Teacher Manuals",),
            ("Answer Keys",),
            ("Question Banks",),
            ("Syllabus",)
        ])
        conn.commit()

    # Create teacher_audit_logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teacher_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_row_id INTEGER NOT NULL,
            teacher_name TEXT,
            changed_at TEXT NOT NULL,
            changed_by TEXT DEFAULT 'Admin',
            changes_json TEXT NOT NULL
        )
    """)
    conn.commit()

    conn.close()

# Initialize DB on load
init_blogs_db()


def format_field_value(val):
    if val is None or val == "":
        return ""
    if isinstance(val, bool):
        return "Yes" if val else "No"
    if isinstance(val, list):
        items = []
        for item in val:
            if isinstance(item, dict):
                items.append(str(item.get("value") or item.get("id") or item))
            else:
                items.append(str(item))
        return ", ".join(items) if items else ""
    if isinstance(val, dict):
        return str(val.get("value") or val.get("id") or val)
    return str(val).strip()


def log_teacher_edit(teacher_row_id: int, teacher_name: str, old_dict: dict, new_dict: dict, changed_keys: list = None, changed_by: str = "Admin"):
    """
    Compares old_dict vs new_dict for changed_keys, extracts modified fields, and inserts an audit log entry.
    """
    import json
    from datetime import datetime

    changes = []
    ignore_keys = {"id", "Teacher ID", "created_on", "IdCardUrl", "Teacher", "order", "created_at", "updated_at"}

    target_keys = changed_keys if changed_keys is not None else list(new_dict.keys())

    for key in sorted(target_keys):
        if key in ignore_keys:
            continue
        
        old_raw = old_dict.get(key)
        new_raw = new_dict.get(key)
        
        old_val = format_field_value(old_raw)
        new_val = format_field_value(new_raw)

        if old_val != new_val:
            changes.append({
                "field": key,
                "old": old_val if old_val else "(empty)",
                "new": new_val if new_val else "(empty)"
            })

    if not changes:
        return

    changes_json_str = json.dumps(changes)
    changed_at = datetime.now().strftime("%d %b %Y, %I:%M %p")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if identical changes were just logged for this teacher
        cursor.execute("""
            SELECT changes_json FROM teacher_audit_logs 
            WHERE teacher_row_id = ? 
            ORDER BY id DESC LIMIT 1
        """, (teacher_row_id,))
        last_row = cursor.fetchone()
        if last_row:
            last_changes = last_row["changes_json"]
            if last_changes == changes_json_str:
                conn.close()
                return

        cursor.execute("""
            INSERT INTO teacher_audit_logs (teacher_row_id, teacher_name, changed_at, changed_by, changes_json)
            VALUES (?, ?, ?, ?, ?)
        """, (teacher_row_id, teacher_name or f"Teacher #{teacher_row_id}", changed_at, changed_by, changes_json_str))
        conn.commit()
        conn.close()
    except Exception as exc:
        print("[Teacher Audit Log] Error inserting audit log:", exc)



