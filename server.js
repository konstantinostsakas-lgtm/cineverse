const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json()); // Απαραίτητο για να διαβάζει JSON δεδομένα (Register/Login)

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Το URL της React σου
    methods: ["GET", "POST"]
  }
});

const JWT_SECRET = "cineverse_super_secret_key_123";

// 🔌 ΣΥΝΔΕΣΗ ΜΕ ΤΗ ΜΥSQL (XAMPP)
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Το default username του XAMPP
  password: '',      // Το default password του XAMPP είναι κενό
  database: 'cineverse_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Δοκιμαστικός έλεγχος σύνδεσης
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Σφάλμα σύνδεσης στη MySQL:", err.message);
  } else {
    console.log("🚀 Η σύνδεση με τη MySQL (cineverse_db) έγινε επιτυχώς!");
    connection.release();
  }
});

// Helper συνάρτηση για να τραβάμε το Leaderboard από τη βάση ανά πάσα στιγμή
const emitLeaderboard = () => {
  db.query('SELECT id, username AS name, avatar, xp, rank_title AS rank FROM users ORDER BY xp DESC LIMIT 10', (err, results) => {
    if (!err) {
      io.emit('leaderboard-update', results);
    }
  });
};


// ==========================================
// 🔐 REAL ENDPOINTS: REGISTER & LOGIN (HTTP)
// ==========================================

// 1. Πραγματικό Register (Εγγραφή)
app.post('/api/register', async (req, res) => {
  const { username, password, avatar } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Συμπληρώστε όνομα χρήστη και κωδικό!" });
  }

  try {
    // Έλεγχος αν υπάρχει ήδη ο χρήστης
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
      if (err) return res.status(500).json({ error: "Σφάλμα βάσης δεδομένων" });
      if (results.length > 0) {
        return res.status(400).json({ error: "Το όνομα χρήστη χρησιμοποιείται ήδη!" });
      }

      // Κρυπτογράφηση κωδικού (Hashing)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Εισαγωγή στη MySQL
      const userAvatar = avatar || '🔥';
      db.query(
        'INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)',
        [username, hashedPassword, userAvatar],
        (err, insertResult) => {
          if (err) return res.status(500).json({ error: "Αποτυχία εγγραφής στη βάση" });
          
          // Ενημέρωση όλων για το νέο leaderboard (αν χρειάζεται)
          emitLeaderboard();
          
          return res.status(201).json({ message: "Η εγγραφή ολοκληρώθηκε επιτυχώς!" });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: "Σφάλμα διακομιστή" });
  }
});

// 2. Πραγματικό Login (Σύνδεση)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: "Σφάλμα βάσης δεδομένων" });
    if (results.length === 0) {
      return res.status(400).json({ error: "Λάθος όνομα χρήστη ή κωδικός πρόσβασης!" });
    }

    const user = results[0];

    // Σύγκριση κρυπτογραφημένου κωδικού
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Λάθος όνομα χρήστη ή κωδικός πρόσβασης!" });
    }

    // Δημιουργία Token ασφαλείας (JWT)
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    // Επιστροφή στοιχείων στη React
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.username,
        avatar: user.avatar,
        xp: user.xp,
        rank: user.rank_title
      }
    });
  });
});


// ==========================================
// 🌐 REAL-TIME WEBSOCKETS (SOCKET.IO)
// ==========================================
io.on('connection', (socket) => {
  console.log(`👤 Χρήστης συνδέθηκε στο WebSocket: ${socket.id}`);

  // Αρχικοποίηση δεδομένων όταν μπαίνει ένας χρήστης ή επισκέπτης
  socket.on('get-initial-data', (userId) => {
    // 1. Παίρνουμε το Leaderboard
    db.query('SELECT id, username AS name, avatar, xp, rank_title AS rank FROM users ORDER BY xp DESC LIMIT 10', (err, leaderboardResults) => {
      if (err) return;

      // 2. Αν είναι συνδεδεμένος πραγματικός χρήστης (όχι guest), στέλνουμε και το profile του
      if (userId && userId !== 'guest') {
        db.query('SELECT id, username AS name, avatar, xp, rank_title AS rank FROM users WHERE id = ?', [userId], (err, profileResults) => {
          if (!err && profileResults.length > 0) {
            socket.emit('initial-data-res', {
              profile: profileResults[0],
              leaderboard: leaderboardResults
            });
          } else {
            socket.emit('initial-data-res', { leaderboard: leaderboardResults });
          }
        });
      } else {
        // Αν είναι Guest, στέλνουμε μόνο το leaderboard
        socket.emit('initial-data-res', { leaderboard: leaderboardResults });
      }
    });
  });

  // Προσθήκη πραγματικών XP στη βάση δεδομένων
  socket.on('add-xp', ({ userId, amount }) => {
    if (!userId || userId === 'guest') return;

    // 1. Κάνουμε UPDATE στη MySQL
    db.query('UPDATE users SET xp = xp + ? WHERE id = ?', [amount, userId], (err, result) => {
      if (err) return;

      // 2. Υπολογισμός και αναβάθμιση του Rank με βάση τα νέα XP
      db.query('SELECT xp FROM users WHERE id = ?', [userId], (err, rows) => {
        if (!err && rows.length > 0) {
          const currentXp = rows[0].xp;
          let newRank = 'Νεοσύλλεκτος Σινεφίλ';

          if (currentXp >= 1000) newRank = 'Μέγας Κριτικός';
          else if (currentXp >= 500) newRank = 'Σινεφίλ Pro';
          else if (currentXp >= 200) newRank = 'Τακτικός Θεατής';

          db.query('UPDATE users SET rank_title = ? WHERE id = ?', [newRank, userId], () => {
            
            // 3. Στέλνουμε το ενημερωμένο profile πίσω στον συγκεκριμένο χρήστη
            socket.emit('profile-update', { xp: currentXp, rank: newRank });

            // 4. Στέλνουμε το νέο Leaderboard σε ΟΛΟΥΣ τους συνδεδεμένους χρήστες real-time
            emitLeaderboard();
          });
        }
      });
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Χρήστης αποσυνδέθηκε: ${socket.id}`);
  });
});

// Εκκίνηση του Server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🎬 CINEVERSE SERVER RUNNING ON PORT ${PORT}`);
  console.log(`==============================================`);
});