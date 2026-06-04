import React from 'react';
import { Award, Film, Clock, ShieldCheck, ArrowLeft, Zap } from 'lucide-react';

function UserProfile({ profile, leaderboard, onBackToHome, onSimulateXp }) {
  if (!profile) return <div style={{ color: '#fff', padding: '2rem' }}>Φόρτωση Προφίλ...</div>;

  // Εύρεση της θέσης του χρήστη στο Championship
  const championshipRank = leaderboard.findIndex(user => user.id === profile.id) + 1;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem', color: '#fff' }}>
      <button className="primary-btn" onClick={onBackToHome} style={{ backgroundColor: 'rgba(250,250,250,0.1)', marginBottom: '2rem', border: '1px solid #444' }}>
        <ArrowLeft size={18} /> Επιστροφή στην Αρχική
      </button>

      {/* Κάρτα Προφίλ */}
      <div style={{ background: 'linear-gradient(135deg, #1e1e2f 0%, #11111b 100%)', borderRadius: '16px', padding: '2.5rem', border: '1px solid #333', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '5rem', background: '#2a2a40', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyInContent: 'center', justifyContent: 'center', borderRadius: '50%', border: '3px solid var(--accent-blue)' }}>
          {profile.avatar}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{profile.name}</h1>
            <span style={{ backgroundColor: 'var(--accent-blue)', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
              {profile.rank}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            Μέλος του Cineverse Championship • Θέση Κατάταξης: <strong style={{ color: '#ffd700' }}>#{championshipRank}</strong>
          </p>
          
          {/* Μπάρα Προόδου XP */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Συνολικά Πόντοι: <strong>{profile.xp} XP</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Επόμενο Rank: 2000 XP</span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#222', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min((profile.xp / 2000) * 100, 100)}%`, height: '100%', backgroundColor: 'var(--accent-blue)', transition: 'width 0.4s ease' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Στατιστικά Χρήστη */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Film size={32} style={{ color: '#e50914' }} />
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{profile.watchedCount}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ταινίες που έχετε δει</div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Clock size={32} style={{ color: '#10b981' }} />
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{Math.floor(profile.watchTime / 60)}ώ {profile.watchTime % 60}λ</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Συνολικός Χρόνος Προβολής</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldCheck size={32} style={{ color: '#ffd700' }} />
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{profile.xp}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Score Πρωταθλήματος</div>
          </div>
        </div>
      </div>

      {/* Κουμπί Δοκιμής / Προσομοίωσης κέρδους XP */}
      <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'rgba(30, 64, 175, 0.2)', border: '1px solid #1e40af', borderRadius: '12px' }}>
        <p style={{ margin: '0 0 1rem 0' }}>💡 Θέλεις να τεστάρεις αν δουλεύει live το Championship;</p>
        <button className="primary-btn" onClick={onSimulateXp} style={{ backgroundColor: '#1e40af', margin: '0 auto' }}>
          <Zap size={16} /> Κέρδισε +150 XP (Παρακολούθηση Ταινίας)
        </button>
      </div>
    </div>
  );
}

export default UserProfile;