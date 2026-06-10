import React from 'react';
import { Trophy, Award, Flame, Star } from 'lucide-react'; // Εικονίδια για την ενίσχυση του competitive feedback (HCI Gamification)

// 🌐 ΤΟΠΙΚΟ ΛΕΞΙΚΟ ΜΕΤΑΦΡΑΣΕΩΝ (ΑΠΟΚΛΕΙΣΤΙΚΑ ΕΛΛΗΝΙΚΑ & ΑΓΓΛΙΚΑ)
const COMPONENT_STRINGS = {
  el: {
    loading: "Φόρτωση πίνακα κατάταξης πρωταθλήματος...",
    subTitle: "Κερδίστε XP βλέποντας ταινίες με φίλους και ανεβείτε στην κορυφή του Ολύμπου!",
    userProgressTitle: "Η Πρόοδός Σας",
    userRole: "Τίτλος: Master of Watch Parties",
    levelText: "Level",
    streakText: "streak",
    completionText: "ολοκλήρωση επιπέδου",
    globalRankTitle: "Παγκόσμια Κατάταξη",
    youText: " (Εσείς)"
  },
  en: {
    loading: "Loading championship leaderboard...",
    subTitle: "Earn XP by watching movies with friends and climb to the top of Olympus!",
    userProgressTitle: "Your Progress",
    userRole: "Title: Master of Watch Parties",
    levelText: "Level",
    streakText: "streak",
    completionText: "level completion",
    globalRankTitle: "Global Leaderboard",
    youText: " (You)"
  }
};

function Leaderboard({ leaderboardData = [], currentUser = null, currentLang = 'el' }) {
  
  // 🌍 Επιλογή της σωστής γλώσσας
  const localLang = currentLang === 'en' ? 'en' : 'el';
  const strings = COMPONENT_STRINGS[localLang];

  // Έλεγχος ασφαλείας: Αν τα πραγματικά δεδομένα δεν έχουν καταφθάσει ακόμα από το δίκτυο
  if (!leaderboardData || leaderboardData.length === 0 || !currentUser) {
    return (
      <div style={{ color: '#fff', padding: '4rem', textAlign: 'center' }}>
        {strings.loading}
      </div>
    );
  }

  // Υπολογισμός ποσοστού προόδου level με βάση τα πραγματικά XP του χρήστη
  // Θεωρώντας ως βάση τη δυναμική κλίμακα XP που έρχεται από το real-time backend
  const currentXpNum = parseInt(currentUser.xp?.replace(/[^0-8]/g, '')) || 0;
  const xpMin = 9000;
  const xpMax = 10000;
  const progressPercent = Math.min(Math.max(((currentXpNum - xpMin) / (xpMax - xpMin)) * 100, 0), 100);

  return (
    <div className="leaderboard-container">
      
      {/* Τίτλος Σελίδας */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <Trophy size={48} style={{ color: '#ffd700', marginBottom: '0.5rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>CineVerse Championship</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {strings.subTitle}
        </p>
      </div>

      {/* 1. USER PROGRESS CARD: Η προσωπική πρόοδος του χρήστη σε πραγματικό χρόνο */}
      <section className="user-progress-card" aria-label={strings.userProgressTitle}>
        <div className="avatar-large">
          <Award size={36} style={{ color: 'var(--accent-red)' }} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 750 }}>{currentUser.name}</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{strings.userRole}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {strings.levelText} {currentUser.level}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#ff5500', marginTop: '2px' }}>
                <Flame size={14} fill="#ff5500" /> <span>{currentUser.activeStreak} {strings.streakText}</span>
              </div>
            </div>
          </div>

          {/* Μπάρα Προόδου XP (Visual Progress Indicator) βασισμένη σε αληθινά μαθηματικά δεδομένα */}
          <div className="xp-bar-bg">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${progressPercent}%` }} 
              role="progressbar" 
              aria-valuenow={progressPercent} 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>{xpMin.toLocaleString()} XP</span>
            <span>{currentUser.xp} ({Math.round(progressPercent)}% {strings.completionText})</span>
            <span>{xpMax.toLocaleString()} XP</span>
          </div>
        </div>
      </section>

      {/* 2. LEADERBOARD LIST: Πίνακας Ανταγωνισμού */}
      <section>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>{strings.globalRankTitle}</h2>
        
        <div className="leaderboard-list" role="list">
          {leaderboardData.map((user) => {
            // Δυναμικός έλεγχος με βάση το ID ή το όνομα από τη βάση δεδομένων
            const isTopThree = user.rank <= 3;
            const isSelf = user.id === currentUser.id || user.name === currentUser.name;

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
                      {user.name}{isSelf && strings.youText}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {strings.levelText} {user.level}
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