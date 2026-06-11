const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// 🔓 ΡΥΘΜΙΣΗ CORS (Επιτρέπει αιτήματα από παντού στο production)
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

// 🔐 SECRET KEY (Χρησιμοποιεί variable online ή το default τοπικά)
const JWT_SECRET = process.env.JWT_SECRET || "CINEVERSE_LOCAL_SECRET_KEY";

// 🔌 ΣΥΝΔΕΣΗ ΜΕ ΤΗ MySQL (Υποστηρίζει Localhost ΚΑΙ Live Database μέσω Environment Variables)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'cineverse_db',
  port: process.env.DB_PORT || 3306,
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

// 🌐 SERVER LISTENING (Δυναμικό PORT για το Render)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🎬 CINEVERSE BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`==============================================`);
});