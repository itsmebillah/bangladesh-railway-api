from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import sqlite3
import json
import os
import asyncio

app = FastAPI(title="Bangladesh Updates API")

# সব ডোমেইন থেকে অ্যাক্সেস দিতে (GitHub Pages থেকে)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ডাটাবেস সেটআপ
def init_db():
    conn = sqlite3.connect('updates.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT,
        original_url TEXT UNIQUE,
        source TEXT,
        category TEXT,
        publish_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_hot BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'active'
    )
    ''')
    
    conn.commit()
    conn.close()

# সোর্স URL লিস্ট
SOURCES = {
    "bpsc": {
        "url": "https://www.bpsc.gov.bd/",
        "name": "বিসিএস কমিশন",
        "category": "job"
    },
    "mopa": {
        "url": "https://www.mopa.gov.bd/",
        "name": "জনপ্রশাসন মন্ত্রণালয়",
        "category": "job"
    },
    "education": {
        "url": "http://www.educationboardresults.gov.bd/",
        "name": "শিক্ষা বোর্ড",
        "category": "education"
    },
    "cabinet": {
        "url": "https://cabinet.gov.bd/",
        "name": "মন্ত্রিপরিষদ বিভাগ",
        "category": "government"
    },
    "btrc": {
        "url": "https://www.btrc.gov.bd/",
        "name": "বিটিআরসি",
        "category": "hot"
    }
}

# সহজ স্ক্র্যাপিং ফাংশন
def scrape_website(source_key: str):
    """ওয়েবসাইট থেকে ডাটা সংগ্রহ"""
    source = SOURCES[source_key]
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        print(f"Scraping: {source['name']}")
        response = requests.get(source['url'], headers=headers, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # বিভিন্ন সাইটের জন্য আলাদা স্ক্র্যাপিং লজিক
            
            if source_key == "bpsc":
                # বিসিএস সাইটের জন্য
                notices = []
                # আসল সাইটের HTML স্ট্রাকচার দেখে এই অংশ পরিবর্তন করবেন
                
                # ডেমো ডাটা
                notices.append({
                    "title": "বিসিএস ৪৫তম বার্ষিক পরীক্ষার বিজ্ঞপ্তি",
                    "url": "https://www.bpsc.gov.bd/site/view/notices/",
                    "summary": "বাংলাদেশ সিভিল সার্ভিস ৪৫তম বার্ষিক পরীক্ষার বিজ্ঞপ্তি প্রকাশিত হয়েছে"
                })
                
            elif source_key == "education":
                # শিক্ষা বোর্ডের জন্য
                notices = []
                notices.append({
                    "title": "এইচএসসি পরীক্ষার রুটিন প্রকাশ",
                    "url": "http://www.educationboardresults.gov.bd/notice/hsc-routine",
                    "summary": "২০২৪ সালের এইচএসসি পরীক্ষার রুটিন প্রকাশিত হয়েছে"
                })
            
            # ডাটাবেসে সেভ
            conn = sqlite3.connect('updates.db')
            cursor = conn.cursor()
            
            for notice in notices:
                cursor.execute('''
                INSERT OR IGNORE INTO updates 
                (title, summary, original_url, source, category, publish_date, is_hot)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    notice["title"],
                    notice.get("summary", ""),
                    notice["url"],
                    source["name"],
                    source["category"],
                    datetime.now().strftime("%Y-%m-%d"),
                    1 if source["category"] == "hot" else 0
                ))
            
            conn.commit()
            conn.close()
            print(f"Successfully scraped {len(notices)} notices from {source['name']}")
            
        else:
            print(f"Failed to fetch {source['url']}: {response.status_code}")
            
    except Exception as e:
        print(f"Error scraping {source_key}: {str(e)}")

# API রাউটস
@app.get("/")
async def root():
    return {
        "message": "বাংলাদেশ আপডেট API সার্ভার চলছে",
        "version": "1.0",
        "endpoints": {
            "/api/updates": "সব আপডেট পান",
            "/api/updates/{category}": "ক্যাটাগরি অনুযায়ী",
            "/api/hot": "হট আপডেট",
            "/api/scrape": "নতুন ডাটা সংগ্রহ করুন",
            "/api/stats": "স্ট্যাটিস্টিক্স"
        }
    }

@app.get("/api/updates")
async def get_updates(category: Optional[str] = None, limit: int = 20):
    """সব আপডেট"""
    conn = sqlite3.connect('updates.db')
    cursor = conn.cursor()
    
    if category:
        cursor.execute('''
        SELECT * FROM updates 
        WHERE category = ? AND status = 'active'
        ORDER BY created_at DESC 
        LIMIT ?
        ''', (category, limit))
    else:
        cursor.execute('''
        SELECT * FROM updates 
        WHERE status = 'active'
        ORDER BY created_at DESC 
        LIMIT ?
        ''', (limit,))
    
    columns = [col[0] for col in cursor.description]
    updates = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "success": True,
        "count": len(updates),
        "updates": updates
    }

@app.get("/api/updates/{category}")
async def get_by_category(category: str, limit: int = 10):
    """ক্যাটাগরি অনুযায়ী"""
    valid_categories = ["job", "education", "government", "hot"]
    
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    conn = sqlite3.connect('updates.db')
    cursor = conn.cursor()
    
    if category == "hot":
        cursor.execute('''
        SELECT * FROM updates 
        WHERE is_hot = 1 AND status = 'active'
        ORDER BY created_at DESC 
        LIMIT ?
        ''', (limit,))
    else:
        cursor.execute('''
        SELECT * FROM updates 
        WHERE category = ? AND status = 'active'
        ORDER BY created_at DESC 
        LIMIT ?
        ''', (category, limit))
    
    columns = [col[0] for col in cursor.description]
    updates = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "success": True,
        "category": category,
        "count": len(updates),
        "updates": updates
    }

@app.get("/api/hot")
async def get_hot_updates(limit: int = 5):
    """হট আপডেট"""
    conn = sqlite3.connect('updates.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT * FROM updates 
    WHERE is_hot = 1 AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT ?
    ''', (limit,))
    
    columns = [col[0] for col in cursor.description]
    updates = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "success": True,
        "count": len(updates),
        "updates": updates
    }

@app.get("/api/scrape")
async def scrape_all():
    """সব সাইট স্ক্র্যাপ করুন"""
    results = {}
    
    for source_key in SOURCES.keys():
        try:
            scrape_website(source_key)
            results[source_key] = "success"
        except Exception as e:
            results[source_key] = f"error: {str(e)}"
    
    return {
        "success": True,
        "message": "স্ক্র্যাপিং সম্পন্ন",
        "results": results,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/stats")
async def get_stats():
    """স্ট্যাটিস্টিক্স"""
    conn = sqlite3.connect('updates.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM updates")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM updates WHERE is_hot = 1")
    hot = cursor.fetchone()[0]
    
    cursor.execute('''
    SELECT category, COUNT(*) as count 
    FROM updates 
    GROUP BY category
    ''')
    
    by_category = {row[0]: row[1] for row in cursor.fetchall()}
    
    cursor.execute("SELECT MAX(created_at) FROM updates")
    last_update = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "success": True,
        "stats": {
            "total_updates": total,
            "hot_updates": hot,
            "by_category": by_category,
            "last_updated": last_update,
            "sources_count": len(SOURCES)
        }
    }

# সার্ভার শুরু হলে
@app.on_event("startup")
async def startup():
    init_db()
    print("✅ Database initialized")
    print("🚀 Server is running!")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
