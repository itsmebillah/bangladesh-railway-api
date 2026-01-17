const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite ডাটাবেস
const db = new sqlite3.Database(':memory:'); // Railway-এ file-based database use করবেন

// ডাটাবেস ইনিশিয়ালাইজ
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT,
    source TEXT,
    category TEXT,
    date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // ডেমো ডাটা ইনসার্ট
  const stmt = db.prepare(`INSERT OR IGNORE INTO updates 
    (title, summary, url, source, category, date) 
    VALUES (?, ?, ?, ?, ?, ?)`);

  const demoData = [
    ["বিসিএস ৪৫তম পরীক্ষার বিজ্ঞপ্তি", "বাংলাদেশ সিভিল সার্ভিস ৪৫তম বার্ষিক পরীক্ষার বিজ্ঞপ্তি প্রকাশিত হয়েছে", "https://www.bpsc.gov.bd", "বিসিএস কমিশন", "job", "২০২৪-০১-১৫"],
    ["সোনালী ব্যাংকে নিয়োগ", "সোনালী ব্যাংক লিমিটেডে সহকারী অফিসার পদে নিয়োগ", "https://www.sonalibank.com.bd", "সোনালী ব্যাংক", "job", "২০২৪-০১-১৪"],
    ["এইচএসসি পরীক্ষার রুটিন", "২০২৪ সালের এইচএসসি পরীক্ষার রুটিন প্রকাশ", "http://www.educationboardresults.gov.bd", "শিক্ষা বোর্ড", "education", "২০২৪-০১-১৩"],
    ["জাতীয় বিশ্ববিদ্যালয় পরীক্ষা স্থগিত", "অনার্স চতুর্থ বর্ষের পরীক্ষা এক সপ্তাহ পিছানো হয়েছে", "https://www.nu.ac.bd", "জাতীয় বিশ্ববিদ্যালয়", "education", "২০২৪-০১-১২"],
    ["২০২৪ সালের ছুটির তালিকা", "সরকারি ছুটির তালিকা প্রকাশিত হয়েছে", "https://cabinet.gov.bd", "মন্ত্রিপরিষদ বিভাগ", "government", "২০২৪-০১-১১"],
    ["ইন্টারনেট ডাটা দাম কমানো", "মোবাইল ইন্টারনেট ডাটা প্যাকের দাম কমানোর সিদ্ধান্ত", "https://www.btrc.gov.bd", "বিটিআরসি", "hot", "২০২৪-০১-১০"],
    ["বেসরকারি কলেজের বেতন নির্ধারণ", "বেসরকারি কলেজের বেতন নির্ধারণ সংক্রান্ত নোটিশ", "https://moedu.gov.bd", "শিক্ষা মন্ত্রণালয়", "education", "২০২৪-০১-০৯"],
    ["বিদ্যুৎ বিলের হার পুনঃনির্ধারণ", "বিদ্যুৎ বিভাগ বিদ্যুৎ বিলের হার পুনঃনির্ধারণ করেছে", "https://powerdivision.gov.bd", "বিদ্যুৎ বিভাগ", "government", "২০২৪-০১-০৮"],
  ];

  demoData.forEach(data => {
    stmt.run(data);
  });

  stmt.finalize();
  console.log("✅ ডাটাবেস তৈরি হয়েছে");
});

// API রুটস
app.get('/', (req, res) => {
  res.json({
    message: "🇧🇩 বাংলাদেশ আপডেট API সার্ভার",
    author: "Bangladesh Public Updates",
    endpoints: [
      "/api/all - সব আপডেট",
      "/api/jobs - চাকরির আপডেট",
      "/api/education - শিক্ষা আপডেট",
      "/api/government - সরকারি নোটিশ",
      "/api/hot - হট আপডেট",
      "/api/health - সার্ভার হেলথ"
    ]
  });
});

app.get('/api/all', (req, res) => {
  db.all("SELECT * FROM updates ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      count: rows.length,
      updates: rows
    });
  });
});

app.get('/api/jobs', (req, res) => {
  db.all("SELECT * FROM updates WHERE category='job' ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      category: "চাকরি",
      count: rows.length,
      updates: rows
    });
  });
});

app.get('/api/education', (req, res) => {
  db.all("SELECT * FROM updates WHERE category='education' ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      category: "শিক্ষা",
      count: rows.length,
      updates: rows
    });
  });
});

app.get('/api/government', (req, res) => {
  db.all("SELECT * FROM updates WHERE category='government' ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      category: "সরকারি নোটিশ",
      count: rows.length,
      updates: rows
    });
  });
});

app.get('/api/hot', (req, res) => {
  db.all("SELECT * FROM updates WHERE category='hot' ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      category: "হট আপডেট",
      count: rows.length,
      updates: rows
    });
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    server: "Railway.app"
  });
});

// নতুন আপডেট যোগ করার API
app.post('/api/add', (req, res) => {
  const { title, summary, url, source, category } = req.body;
  
  if (!title || !url) {
    return res.status(400).json({ error: "Title and URL required" });
  }

  const date = new Date().toLocaleDateString('bn-BD');
  
  db.run(
    `INSERT INTO updates (title, summary, url, source, category, date) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, summary, url, source, category, date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        success: true,
        message: "আপডেট যোগ করা হয়েছে",
        id: this.lastID
      });
    }
  );
});

// সার্ভার শুরু
app.listen(PORT, () => {
  console.log(`🚀 সার্ভার চলছে: http://localhost:${PORT}`);
  console.log(`📡 API এন্ডপয়েন্ট: http://localhost:${PORT}/api/all`);
});
