const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"]
    }
});

// Ψεύτικη Βάση Δεδομένων στη μνήμη του Server για Χρήστες & Championship
let usersDB = {
    "user_1": { id: "user_1", name: "Ήφαιστος", avatar: "🔥", xp: 1250, rank: "Cinephile Master", watchedCount: 14, watchTime: 1680 },
    "user_2": { id: "user_2", name: "Γιώργος (Πρωτανωπία)", avatar: "🕶️", xp: 980, rank: "Movie Buff", watchedCount: 10, watchTime: 1200 },
    "user_3": { id: "user_3", name: "Κατερίνα (Cinephile)", avatar: "🍿", xp: 1420, rank: "Grandmaster", watchedCount: 19, watchTime: 2100 },
    "user_4": { id: "user_4", name: "Μαρία", avatar: "🎬", xp: 640, rank: "Casual Viewer", watchedCount: 5, watchTime: 540 }
};

io.on('connection', (socket) => {
    console.log(`👤 Χρήστης συνδέθηκε: ${socket.id}`);

    // 1. Αποστολή των δεδομένων προφίλ και πρωταθλήματος μόλις συνδεθεί η React
    socket.on('get-initial-data', (userId) => {
        const currentUser = usersDB[userId] || usersDB["user_1"];
        // Μετατροπή της DB σε πίνακα και ταξινόμηση με βάση τους πόντους (XP) για το Championship
        const leaderboard = Object.values(usersDB).sort((a, b) => b.xp - a.xp);
        
        socket.emit('initial-data-res', {
            profile: currentUser,
            leaderboard: leaderboard
        });
    });

    // 2. Λειτουργία Watch Party & Συγχρονισμού
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
    });

    socket.on('video-control', (data) => {
        socket.to(data.roomId).emit('video-control-client', data);
    });

    socket.on('send-message', (data) => {
        socket.to(data.roomId).emit('receive-message', data.message);
        
        // 🏆 Επιβράβευση: Κάθε φορά που ο χρήστης στέλνει μήνυμα στο Watch Party κερδίζει 10 XP!
        if (usersDB[data.userId]) {
            usersDB[data.userId].xp += 10;
            // Ενημέρωση όλων για το νέο Leaderboard
            const updatedLeaderboard = Object.values(usersDB).sort((a, b) => b.xp - a.xp);
            io.emit('leaderboard-update', updatedLeaderboard);
            socket.emit('profile-update', usersDB[data.userId]);
        }
    });

    // 🏆 Λειτουργία προσθήκης XP (π.χ. όταν τελειώνει μια ταινία ή κερδίζει ένα mini-game)
    socket.on('add-xp', ({ userId, amount }) => {
        if (usersDB[userId]) {
            usersDB[userId].xp += amount;
            usersDB[userId].watchTime += Math.floor(amount / 2); // Αυξάνουμε εικονικά και το χρόνο
            
            // Αλλαγή τίτλου ανάλογα με τα XP
            if (usersDB[userId].xp > 1500) usersDB[userId].rank = "Grandmaster";
            else if (usersDB[userId].xp > 1000) usersDB[userId].rank = "Cinephile Master";
            
            const updatedLeaderboard = Object.values(usersDB).sort((a, b) => b.xp - a.xp);
            io.emit('leaderboard-update', updatedLeaderboard);
            socket.emit('profile-update', usersDB[userId]);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Χρήστης αποσυνδέθηκε`);
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`🚀 Watch Party & Championship Server: http://localhost:${PORT}`);
});