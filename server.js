const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// 🔓 ΡΥΘΜΙΣΗ CORS (Επιτρέπει αιτήματα από το τοπικό React)
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST"]
}));
app.use(express.json());

const server = http.createServer(app);

// 📡 ΡΥΘΜΙΣΗ SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// 🔐 SECRET KEY (Για το Localhost)
const JWT_SECRET = "CINEVERSE_LOCAL_SECRET_KEY";

// 🔌 ΣΥΝΔΕΣΗ ΜΕ ΤΗ MySQL (ΡΥΘΜΙΣΗ ΓΙΑ XAMPP)
const db = mysql.createPool({
  host: 'localhost',         // Σταθερό για XAMPP
  user: 'root',              // Σταθερό για XAMPP
  password: '',              // Κενό για XAMPP
  database: 'cineverse_db',  // Το όνομα της βάσης σου στο phpMyAdmin
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Σφάλμα σύνδεσης στη MySQL:", err.message);
  } else { 
    console.log("🚀 Η σύνδεση με τη MySQL έγινε επιτυχώς!"); 
    connection.release(); 
  }
});

// Live συγχρονισμός leaderboard
const emitLeaderboard = () => {
  db.query('SELECT id, username AS name, avatar, xp, rank_title AS rank FROM users ORDER BY xp DESC LIMIT 10', (err, results) => {
    if (!err) io.emit('leaderboard-update', results);
  });
};

// ==========================================
// 🔐 AUTH ENDPOINTS
// ==========================================
app.post('/api/register', async (req, res) => {
  const { username, password, avatar } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Συμπληρώστε όλα τα πεδία!" });

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: "Σφάλμα βάσης δεδομένων" });
    if (results.length > 0) return res.status(400).json({ error: "Το username χρησιμοποιείται ήδη!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userAvatar = avatar || '🍿';

    db.query('INSERT INTO users (username, password, avatar, xp, rank_title) VALUES (?, ?, ?, 0, "Νεοσύλλεκτος Σινεφίλ")', [username, hashedPassword, userAvatar], (err) => {
      if (err) return res.status(500).json({ error: "Αποτυχία εγγραφής στη βάση" });
      emitLeaderboard();
      return res.status(201).json({ message: "Η εγγραφή ολοκληρώθηκε επιτυχώς!" });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: "Σφάλμα βάσης δεδομένων" });
    if (results.length === 0) return res.status(400).json({ error: "Λάθος στοιχεία σύνδεσης!" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Λάθος στοιχεία σύνδεσης!" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ 
      token, 
      user: { id: user.id, name: user.username, avatar: user.avatar, xp: user.xp, rank: user.rank_title } 
    });
  });
});

// (Υπόλοιπα Endpoints: friends/search, friends/request κλπ παραμένουν ίδια)
// ... [Σημείωση: Μπορείς να αφήσεις τα υπόλοιπα endpoints που είχες, δεν αλλάζουν]

// 🌐 SERVER LISTENING
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🎬 CINEVERSE LOCAL BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`==============================================`);
});