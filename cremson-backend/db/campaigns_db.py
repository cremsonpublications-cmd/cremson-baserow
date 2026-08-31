import sqlite3
import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("uvicorn.error")

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "campaigns.db")


def get_campaign_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_campaigns_db():
    """Create campaigns and campaign_recipients tables if they do not exist."""
    conn = get_campaign_db()
    cursor = conn.cursor()
    
    # 1. WhatsApp Campaigns Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_name TEXT NOT NULL,
            template_name TEXT NOT NULL,
            template_language TEXT NOT NULL DEFAULT 'en',
            audience_type TEXT NOT NULL,
            audience_filter TEXT DEFAULT '',
            total_recipients INTEGER DEFAULT 0,
            queued_count INTEGER DEFAULT 0,
            sent_count INTEGER DEFAULT 0,
            delivered_count INTEGER DEFAULT 0,
            read_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'draft',
            variables_json TEXT DEFAULT '{}',
            scheduled_at TEXT,
            started_at TEXT,
            completed_at TEXT,
            created_by TEXT DEFAULT 'Admin',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # 2. WhatsApp Campaign Recipients Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS whatsapp_campaign_recipients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id INTEGER NOT NULL,
            user_id TEXT DEFAULT '',
            phone_number TEXT NOT NULL,
            recipient_name TEXT DEFAULT '',
            template_variables_json TEXT DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'pending',
            whatsapp_message_id TEXT UNIQUE,
            error_code TEXT DEFAULT '',
            error_message TEXT DEFAULT '',
            queued_at TEXT,
            sent_at TEXT,
            delivered_at TEXT,
            read_at TEXT,
            failed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (campaign_id) REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE
        )
    """)

    # Custom WhatsApp Templates Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS custom_whatsapp_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'MARKETING',
            language TEXT NOT NULL DEFAULT 'en',
            status TEXT NOT NULL DEFAULT 'APPROVED',
            description TEXT DEFAULT '',
            variables_json TEXT DEFAULT '[]',
            buttons_json TEXT DEFAULT '[]',
            body_preview TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # Create Indexes for lightning-fast queries & webhook lookups
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_campaign_status ON whatsapp_campaigns(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recipient_campaign ON whatsapp_campaign_recipients(campaign_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recipient_wamid ON whatsapp_campaign_recipients(whatsapp_message_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recipient_status ON whatsapp_campaign_recipients(campaign_id, status)")

    # 3. Landing Campaigns Table (for campaign landing pages)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS landing_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            data TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_landing_campaign_slug ON landing_campaigns(slug)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_landing_campaign_active ON landing_campaigns(is_active)")

    conn.commit()
    conn.close()
    logger.info("[Campaigns DB] Initialized SQLite campaigns.db tables & indexes successfully.")
