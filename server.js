const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const JWT_SECRET = process.env.JWT_SECRET || "CINEVERSE_LOCAL_SECRET_KEY";

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
  if (err) console.error("❌ Σφάλμα σύνδεσης στη MySQL:", err.message);
  else { console.log("🚀 Σύνδεση με MySQL επιτυχής!"); connection.release(); }
});

const emitLeaderboard = () => {
  db.query('SELECT id, username AS name, avatar, xp, rank_title AS `rank` FROM users ORDER BY xp DESC LIMIT 10', (err, results) => {
    if (!err) io.emit('leaderboard-update', results);
  });
};

// ==========================================
// 👥 FRIENDS ENDPOINTS
// ==========================================

app.get('/api/friends/list/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query(`
    SELECT u.id, u.username, u.avatar, u.rank_title AS \`rank\`
    FROM friendships f
    JOIN users u ON (
      CASE WHEN f.sender_id = ? THEN f.receiver_id ELSE f.sender_id END = u.id
    )
    WHERE (f.sender_id = ? OR f.receiver_id = ?)
      AND f.status = 'accepted'
  `, [userId, userId, userId], (err, results) => {
    if (err) { console.error(err); return res.status(500).json([]); }
    res.json(results || []);
  });
});

app.get('/api/friends/pending/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query(`
    SELECT f.id AS friendshipId, u.id, u.username, u.avatar
    FROM friendships f
    JOIN users u ON f.sender_id = u.id
    WHERE f.receiver_id = ? AND f.status = 'pending'
  `, [userId], (err, results) => {
    if (err) { console.error(err); return res.status(500).json([]); }
    res.json(results || []);
  });
});

app.post('/api/friends/request', (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: "Missing senderId or receiverId" });
  if (senderId === receiverId) return res.status(400).json({ error: "Cannot add yourself" });

  db.query(
    `SELECT id FROM friendships WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
    [senderId, receiverId, receiverId, senderId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (results.length > 0) return res.status(400).json({ error: "Friendship already exists" });

      db.query(
        `INSERT INTO friendships (sender_id, receiver_id, status) VALUES (?, ?, 'pending')`,
        [senderId, receiverId],
        (err) => {
          if (err) return res.status(500).json({ error: "Failed to send request" });
          io.to(`user-${receiverId}`).emit('new-friend-request');
          res.json({ message: "Friend request sent!" });
        }
      );
    }
  );
});

app.post('/api/friends/respond', (req, res) => {
  const { friendshipId, action } = req.body;
  if (!friendshipId || !action) return res.status(400).json({ error: "Missing fields" });

  const status = action === 'accept' ? 'accepted' : 'rejected';
  db.query(
    `UPDATE friendships SET status = ? WHERE id = ?`,
    [status, friendshipId],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to respond" });
      res.json({ message: `Friendship ${status}` });
    }
  );
});

app.get('/api/users/search', (req, res) => {
  const { q, currentUserId } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  db.query(
    `SELECT id, username, avatar FROM users WHERE username LIKE ? AND id != ? LIMIT 10`,
    [`%${q}%`, currentUserId || 0],
    (err, results) => {
      if (err) return res.status(500).json([]);
      res.json(results || []);
    }
  );
});

// ==========================================
// 🎭 AVATARS
// ==========================================
app.get('/api/avatars', (req, res) => {
  res.json({ avatars: ['🍿', '🎬', '🎭', '👽', '🦸‍♂️', '🧟‍♀️', '🥷', '🧙‍♂️'] });
});

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

    db.query(
      'INSERT INTO users (username, password, avatar, xp, rank_title) VALUES (?, ?, ?, 0, "Νεοσύλλεκτος Σινεφίλ")',
      [username, hashedPassword, avatar || '🍿'],
      (err) => {
        if (err) return res.status(500).json({ error: "Αποτυχία εγγραφής στη βάση" });
        emitLeaderboard();
        return res.status(201).json({ message: "Η εγγραφή ολοκληρώθηκε επιτυχώς!" });
      }
    );
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

// ==========================================
// 📡 SOCKET.IO
// ==========================================
io.on('connection', (socket) => {
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('send-watch-party-invite', ({ senderId, receiverId }) => {
    io.to(`user-${receiverId}`).emit('watch-party-invite', { senderId });
  });
});

// ==========================================
// 🚀 SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🎬 CINEVERSE BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`==============================================`);
});