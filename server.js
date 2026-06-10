const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// 🔓 ΡΥΘΜΙΣΗ CORS ΓΙΑ PRODUCTION & https://cineverse-4vkd.onrender.com
app.use(cors({
  origin: "*", // Επιτρέπει στη live React (Vercel) να επικοινωνεί με το backend
  methods: ["GET", "POST"]
}));
app.use(express.json());

const server = http.createServer(app);

// 📡 ΡΥΘΜΙΣΗ SOCKET.IO ΓΙΑ ΟΛΑ ΤΑ DOMAINS
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// 🔐 ΠΡΑΓΜΑΤΙΚΟ PRODUCTION SECRET (Μέσω Environment Variables)
const JWT_SECRET = process.env.JWT_SECRET || "CINEVERSE_PRODUCTION_SECURE_KEY_894320984";

// 🔌 ΣΥΝΔΕΣΗ ΜΕ ΤΗ ΜΥSQL (Υποστηρίζει https://cineverse-4vkd.onrender.com ΚΑΙ Live Database)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'https://cineverse-4vkd.onrender.com',
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

// Live συγχρονισμός leaderboard σε όλους τους online χρήστες
const emitLeaderboard = () => {
  db.query('SELECT id, username AS name, avatar, xp, rank_title AS rank FROM users ORDER BY xp DESC LIMIT 10', (err, results) => {
    if (!err) io.emit('leaderboard-update', results);
  });
};

// ==========================================
// 🔐 AUTH ENDPOINTS (REAL REGISTER & LOGIN)
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

// ==========================================
// 👥 FRIENDS SYSTEM ENDPOINTS (REAL SQL)
// ==========================================
app.get('/api/users/search', (req, res) => {
  const { q, currentUserId } = req.query;
  db.query(
    'SELECT id, username, avatar, rank_title AS rank FROM users WHERE username LIKE ? AND id != ? LIMIT 5',
    [`%${q}%`, currentUserId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Σφάλμα κατά την αναζήτηση" });
      res.json(results);
    }
  );
});

app.post('/api/friends/request', (req, res) => {
  const { senderId, receiverId } = req.body;
  
  db.query('SELECT * FROM friendships WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)', 
  [senderId, receiverId, receiverId, senderId], (err, row) => {
    if (err) return res.status(500).json({ error: "Σφάλμα ελέγχου" });
    if (row.length > 0) return res.status(400).json({ error: "Υπάρχει ήδη εκκρεμές αίτημα ή φιλία." });

    db.query(
      'INSERT INTO friendships (sender_id, receiver_id, status) VALUES (?, ?, "pending")',
      [senderId, receiverId],
      (err) => {
        if (err) return res.status(400).json({ error: "Αποτυχία αποστολής αιτήματος." });
        io.to(`user_room_${receiverId}`).emit('new-friend-request');
        res.json({ success: true, message: "Το αίτημα φιλίας στάλθηκε!" });
      }
    );
  });
});

app.get('/api/friends/pending/:userId', (req, res) => {
  const { userId } = req.params;
  db.query(
    'SELECT f.id AS friendshipId, u.id AS senderId, u.username, u.avatar FROM friendships f JOIN users u ON f.sender_id = u.id WHERE f.receiver_id = ? AND f.status = "pending"',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Σφάλμα φόρτωσης αιτημάτων" });
      res.json(results);
    }
  );
});

app.post('/api/friends/respond', (req, res) => {
  const { friendshipId, action } = req.body;
  
  if (action === 'accept') {
    db.query('UPDATE friendships SET status = "accepted" WHERE id = ?', [friendshipId], (err) => {
      if (err) return res.status(500).json({ error: "Σφάλμα κατά την αποδοχή" });
      res.json({ success: true, message: "Το αίτημα έγινε δεκτό!" });
    });
  } else {
    db.query('DELETE FROM friendships WHERE id = ?', [friendshipId], (err) => {
      if (err) return res.status(500).json({ error: "Σφάλμα κατά την απόρριψη" });
      res.json({ success: true, message: "Το αίτημα απορρίφθηκε." });
    });
  }
});

app.get('/api/friends/list/:userId', (req, res) => {
  const { userId } = req.params;
  db.query(
    `SELECT u.id, u.username, u.avatar, u.rank_title AS rank, u.xp 
     FROM friendships f 
     JOIN users u ON u.id = CASE WHEN f.sender_id = ? THEN f.receiver_id ELSE f.sender_id END
     WHERE (f.sender_id = ? OR f.receiver_id = ?) AND f.status = 'accepted'`,
    [userId, userId, userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Σφάλμα ανάκτησης λίστας φίλων" });
      res.json(results);
    }
  );
});

// ==========================================
// 🌐 REAL-TIME WEBSOCKETS & WATCH PARTY CAMERAS
// ==========================================
io.on('connection', (socket) => {
  
  socket.on('join-user-room', (userId) => {
    if (userId && userId !== 'guest') {
      socket.join(`user_room_${userId}`);
      console.log(`📡 Live User Connected: Room user_room_${userId}`);
    }
  });

  // --- WATCH PARTY REAL-TIME STREAMING EVENTS ---
  
  socket.on('join-watch-party', ({ movieId, userId, username, avatar }) => {
    socket.join(`movie_room_${movieId}`);
    socket.movieId = movieId;
    socket.userId = userId;

    socket.to(`movie_room_${movieId}`).emit('party-user-joined', {
      userId,
      username,
      avatar,
      socketId: socket.id
    });
  });

  socket.on('toggle-camera', ({ movieId, userId, enabled }) => {
    socket.to(`movie_room_${movieId}`).emit('party-user-camera-changed', {
      userId,
      enabled
    });
  });

  socket.on('toggle-audio', ({ movieId, userId, enabled }) => {
    socket.to(`movie_room_${movieId}`).emit('party-user-audio-changed', {
      userId,
      enabled
    });
  });

  socket.on('leave-watch-party', ({ movieId, userId }) => {
    socket.leave(`movie_room_${movieId}`);
    socket.to(`movie_room_${movieId}`).emit('party-user-left', { userId });
  });

  // --- SYSTEM INITIAL DATA & GAMIFICATION ---

  socket.on('get-initial-data', (userId) => {
    db.query('SELECT id, username AS name, avatar, xp, rank_title AS rank FROM users ORDER BY xp DESC LIMIT 10', (err, leaderboardResults) => {
      if (err) return;
      if (userId && userId !== 'guest') {
        db.query('SELECT id, username AS name, avatar, xp, rank_title AS rank FROM users WHERE id = ?', [userId], (err, profileResults) => {
          if (!err && profileResults.length > 0) {
            socket.emit('initial-data-res', { profile: profileResults[0], leaderboard: leaderboardResults });
          } else {
            socket.emit('initial-data-res', { leaderboard: leaderboardResults });
          }
        });
      } else {
        socket.emit('initial-data-res', { leaderboard: leaderboardResults });
      }
    });
  });

  socket.on('add-xp', ({ userId, amount }) => {
    if (!userId || userId === 'guest') return;
    
    db.query('UPDATE users SET xp = xp + ? WHERE id = ?', [amount, userId], (err) => {
      if (err) return;
      
      db.query('SELECT xp FROM users WHERE id = ?', [userId], (err, rows) => {
        if (!err && rows.length > 0) {
          const currentXp = rows[0].xp;
          
          let newRank = 'Νεοσύλλεκτος Σινεφίλ';
          if (currentXp >= 1000) newRank = 'Μέγας Κριτικός';
          else if (currentXp >= 500) newRank = 'Σινεφίλ Pro';
          else if (currentXp >= 200) newRank = 'Τακτικός Θεατής';

          db.query('UPDATE users SET rank_title = ? WHERE id = ?', [newRank, userId], () => {
            socket.emit('profile-update', { xp: currentXp, rank: newRank });
            emitLeaderboard();
          });
        }
      });
    });
  });

  socket.on('disconnect', () => {
    if (socket.movieId && socket.userId) {
      io.to(`movie_room_${socket.movieId}`).emit('party-user-left', { userId: socket.userId });
    }
  });
});

// 🌐 ΔΥΝΑΜΙΚΗ ΠΟΡΤΑ ΓΙΑ ΤΑ LIVE CLOUDS (RENDER, RAILWAY ΚΛΠ)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🎬 CINEVERSE LIVE BACKEND SERVER RUNNING ON PORT ${PORT}`);
  console.log(`==============================================`);
});