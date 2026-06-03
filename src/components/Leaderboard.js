import React from 'react';
import { Trophy, Award, Flame, Star } from 'lucide-react'; // Εικονίδια για την ενίσχυση του competitive feedback (HCI Gamification)

function Leaderboard() {
  // Mock δεδομένα χρηστών για τον πίνακα κατάταξης (Gamification Engine)
  const leaderboardData = [
    { rank: 1, name: "Νίκος (Δίας)", xp: "14,850 XP", level: 42, activeStreak: "12 μέρες" },
    { rank: 2, name: "Άννα (Αθηνά)", xp: "12,200 XP", level: 35, activeStreak: "8 μέρες" },
    { rank: 3, name: "Εσείς (Ήφαιστος)", xp: "9,450 XP", level: 28, activeStreak: "5 μέρες" }, // Ο συνδεδεμένος χρήστης
    { rank: 4, name: "Δημήτρης (Άρης)", xp: "8,100 XP", level: 24, activeStreak: "0 μέρες" },
    { rank: 5, name: "Ελένη (Αφροδίτη)", xp: "6,900 XP", level: 19, activeStreak: "3 μέρες" }
  ];

  // Στοιχεία προόδου ειδικά για τον τρέχοντα χρήστη (Εσείς - Ήφαιστος)
  const currentUser = leaderboardData[2];

  return (
    <div className="leaderboard-container">
      
      {/* Τίτλος Σελίδας */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <Trophy size={48} style={{ color: '#ffd700', marginBottom: '0.5rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>CineVerse Championship</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Κερδίστε XP βλέποντας ταινίες με φίλους και ανεβείτε στην κορυφή του Ολύμπου!
        </p>
      </div>

      {/* 1. USER PROGRESS CARD: Η προσωπική πρόοδος του χρήστη σε πραγματικό χρόνο */}
      <section className="user-progress-card" aria-label="Η Πρόοδός Σας">
        <div className="avatar-large">
          <Award size={36} style={{ color: 'var(--accent-red)' }} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 750 }}>{currentUser.name}</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Τίτλος: Master of Watch Parties</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                Level {currentUser.level}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#ff5500', marginTop: '2px' }}>
                <Flame size={14} fill="#ff5500" /> <span>{currentUser.activeStreak} streak</span>
              </div>
            </div>
          </div>

          {/* Μπάρα Προόδου XP (Visual Progress Indicator) */}
          <div className="xp-bar-bg">
            <div className="xp-bar-fill" style={{ width: '65%' }} role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>9,000 XP</span>
            <span>{currentUser.xp} (65% ολοκλήρωση επιπέδου)</span>
            <span>10,000 XP</span>
          </div>
        </div>
      </section>

      {/* 2. LEADERBOARD LIST: Πίνακας Ανταγωνισμού */}
      <section>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>Παγκόσμια Κατάταξη</h2>
        
        <div className="leaderboard-list" role="list">
          {leaderboardData.map((user) => {
            // Έλεγχος αν πρόκειται για την κορυφαία τριάδα ή για τον ίδιο τον χρήστη για διαφοροποίηση στυλ
            const isTopThree = user.rank <= 3;
            const isSelf = user.rank === 3;

            return (
              <div 
                key={user.rank} 
                className={`leaderboard-item ${isTopThree ? 'top-three' : ''}`}
                style={{
                  backgroundColor: isSelf ? '#222c3a' : '#1a1a1a', // HCI: Highlight της θέσης του ίδιου του χρήστη
                  border: isSelf ? '1px solid var(--accent-blue)' : '1px solid transparent',
                  paddingLeft: isSelf ? '12px' : '16px'
                }}
                role="listitem"
              >
                {/* Αριστερό Μέρος: Rank και Όνομα */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <span style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 800, 
                    color: user.rank === 1 ? '#ffd700' : user.rank === 2 ? '#c0c0c0' : user.rank === 3 ? '#cd7f32' : 'var(--text-muted)',
                    minWidth: '24px'
                  }}>
                    #{user.rank}
                  </span>
                  <div>
                    <span style={{ fontWeight: isSelf ? '700' : '500', color: '#fff' }}>
                      {user.name} {isSelf && " (Εσείς)"}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Level {user.level}
                    </span>
                  </div>
                </div>

                {/* Δεξί Μέρος: Πόντοι XP */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={14} fill="#ffd700" color="#ffd700" />
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user.xp}</span>
                </div>

              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

export default Leaderboard;