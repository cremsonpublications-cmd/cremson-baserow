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
    
    # Run migration check for pdf columns
    cursor.execute("PRAGMA table_info(blogs)")
    columns = [col[1] for col in cursor.fetchall()]
    if "pdf_url" not in columns:
        cursor.execute("ALTER TABLE blogs ADD COLUMN pdf_url TEXT")
    if "pdf_name" not in columns:
        cursor.execute("ALTER TABLE blogs ADD COLUMN pdf_name TEXT")
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

    # No seeding. Table will start empty so user can add manually.
    pass

    conn.close()

# Initialize DB on load
init_blogs_db()

