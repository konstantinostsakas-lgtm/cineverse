import React, { useState } from 'react';
import { Award, Film, Clock, ShieldCheck, ArrowLeft, Zap, X } from 'lucide-react';

// 🌐 ΤΟΠΙΚΟ ΛΕΞΙΚΟ ΜΕΤΑΦΡΑΣΕΩΝ (ΑΠΟΚΛΕΙΣΤΙΚΑ ΕΛΛΗΝΙΚΑ & ΑΓΓΛΙΚΑ)
const COMPONENT_STRINGS = {
  el: {
    loadingProfile: "Φόρτωση Προφίλ...",
    backHome: "Επιστροφή στην Αρχική",
    subMember: "Μέλος του Cineverse Championship • Θέση Κατάταξης:",
    totalPoints: "Συνολικοί Πόντοι:",
    nextMilestone: "Επόμενο Ορόσημο:",
    watchedMoviesTitle: "Ταινίες που έχετε δει",
    viewText: "(Προβολή)",
    totalWatchTime: "Συνολικός Χρόνος Προβολής",
    scoreChampionship: "Score Πρωταθλήματος",
    simulationText: "💡 Θέλεις να τεστάρεις αν δουλεύει live το Championship;",
    simulationBtn: "Κέρδισε +150 XP (Παρακολούθηση Ταινίας)",
    historyHeader: "Ιστορικό Προβολών",
    noMoviesYet: "Δεν έχετε παρακολουθήσει κάποια ταινία ακόμα.",
    movieTitlePlaceholder: "Τίτλος Ταινίας",
    dateText: "Ημ/νία:",
    closeBtn: "Κλείσιμο",
    hoursUnit: "ώ",
    minsUnit: "λ"
  },
  en: {
    loadingProfile: "Loading Profile...",
    backHome: "Back to Home",
    subMember: "Cineverse Championship Member • Leaderboard Rank:",
    totalPoints: "Total Points:",
    nextMilestone: "Next Milestone:",
    watchedMoviesTitle: "Movies you've watched",
    viewText: "(View)",
    totalWatchTime: "Total Watch Time",
    scoreChampionship: "Championship Score",
    simulationText: "💡 Want to test if the Championship is live?",
    simulationBtn: "Earn +150 XP (Watch Movie)",
    historyHeader: "Watch History",
    noMoviesYet: "You haven't watched any movies yet.",
    movieTitlePlaceholder: "Movie Title",
    dateText: "Date:",
    closeBtn: "Close",
    hoursUnit: "h",
    minsUnit: "m"
  }
};

function UserProfile({ profile, leaderboard = [], onBackToHome, onSimulateXp, currentLang = 'el' }) {
  const [showHistory, setShowHistory] = useState(false); // State για το άνοιγμα/κλείσιμο του ιστορικού

  // 🌍 Επιλογή της σωστής γλώσσας
  const localLang = currentLang === 'en' ? 'en' : 'el';
  const strings = COMPONENT_STRINGS[localLang];

  if (!profile) return <div style={{ color: '#fff', padding: '4rem', textAlign: 'center' }}>{strings.loadingProfile}</div>;

  // Εύρεση της πραγματικής θέσης του χρήστη στο live Championship leaderboard
  const championshipRank = leaderboard.findIndex(user => user.id === profile.id) + 1;

  // Χρήση αποκλειστικά των πραγματικών δεδομένων από το προφίλ (αν δεν υπάρχει, θεωρείται άδεια λίστα)
  const realWatchedMovies = profile.watchedMovies || [];

  // ΔΥΝΑΜΙΚΟΣ ΥΠΟΛΟΓΙΣΜΟΣ RANK (Αφαίρεση mock '2000 XP'): 
  // Υπολογίζει το επόμενο milestone ανά 1000 XP με βάση το live σκορ του χρήστη
  const currentXp = profile.xp || 0;
  const nextLevelXp = Math.ceil((currentXp + 1) / 1000) * 1000;
  const prevLevelXp = nextLevelXp - 1000;
  const progressPercentage = ((currentXp - prevLevelXp) / 1000) * 100;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem', color: '#fff' }}>
      <button className="primary-btn" onClick={onBackToHome} style={{ backgroundColor: 'rgba(250,250,250,0.1)', marginBottom: '2rem', border: '1px solid #444' }}>
        <ArrowLeft size={18} /> {strings.backHome}
      </button>

      {/* Κάρτα Προφίλ Χρήστη */}
      <div style={{ background: 'linear-gradient(135deg, #1e1e2f 0%, #11111b 100%)', borderRadius: '16px', padding: '2.5rem', border: '1px solid #333', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '5rem', background: '#2a2a40', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '3px solid var(--accent-blue)' }}>
          {profile.avatar}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{profile.name || profile.username}</h1>
            <span style={{ backgroundColor: 'var(--accent-blue)', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
              {profile.rank || 'Bronze Player'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            {strings.subMember} <strong style={{ color: '#ffd700' }}>#{championshipRank > 0 ? championshipRank : '--'}</strong>
          </p>
          
          {/* Μπάρα Προόδου XP - Πλήρως Δυναμική */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>{strings.totalPoints} <strong>{currentXp} XP</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>{strings.nextMilestone} {nextLevelXp} XP</span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#222', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%`, height: '100%', backgroundColor: 'var(--accent-blue)', transition: 'width 0.4s ease' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Πραγματικά Στατιστικά Χρήστη */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* ΚΟΥΜΠΙ: Άνοιγμα πραγματικού ιστορικού */}
        <button 
          onClick={() => setShowHistory(true)}
          style={{ 
            backgroundColor: '#111', 
            border: '1px solid #333', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            cursor: 'pointer',
            textAlign: 'left',
            color: '#fff',
            transition: 'transform 0.2s, border-color 0.2s, background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.borderColor = '#e50914';
            e.currentTarget.style.backgroundColor = '#161616';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.backgroundColor = '#111';
          }}
        >
          <Film size={32} style={{ color: '#e50914' }} />
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{profile.watchedCount || realWatchedMovies.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {strings.watchedMoviesTitle} <span style={{ color: '#e50914', fontSize: '0.8rem' }}>{strings.viewText}</span>
            </div>
          </div>
        </button>
        
        {/* Συνολικός Χρόνος Προβολής από τη Βάση */}
        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Clock size={32} style={{ color: '#10b981' }} />
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {profile.watchTime ? `${Math.floor(profile.watchTime / 60)}${strings.hoursUnit} ${profile.watchTime % 60}${strings.minsUnit}` : `0${strings.hoursUnit} 0${strings.minsUnit}`}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{strings.totalWatchTime}</div>
          </div>
        </div>

        {/* Live Score Πρωταθλήματος */}
        <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldCheck size={32} style={{ color: '#ffd700' }} />
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentXp}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{strings.scoreChampionship}</div>
          </div>
        </div>
      </div>

      {/* Κουμπί Προσομοίωσης / Επικοινωνίας με το Live API */}
      <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'rgba(30, 64, 175, 0.2)', border: '1px solid #1e40af', borderRadius: '12px' }}>
        <p style={{ margin: '0 0 1rem 0' }}>{strings.simulationText}</p>
        <button className="primary-btn" onClick={() => onSimulateXp && onSimulateXp(profile.id)} style={{ backgroundColor: '#1e40af', margin: '0 auto' }}>
          <Zap size={16} /> {strings.simulationBtn}
        </button>
      </div>

      {/* MODAL: Παράθυρο Ιστορικού Προβολών με Real Δεδομένα */}
      {showHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#181824', width: '90%', maxWidth: '500px', borderRadius: '16px', border: '1px solid #333', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #2a2a3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Film size={20} color="#e50914" /> {strings.historyHeader}
              </h3>
              <button 
                onClick={() => setShowHistory(false)} 
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Λίστα Ταινιών από τη MySQL */}
            <div style={{ padding: '1.5rem', maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {realWatchedMovies.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', margin: '2rem 0' }}>{strings.noMoviesYet}</p>
              ) : (
                realWatchedMovies.map((movie, index) => (
                  <div key={movie.id || index} style={{ backgroundColor: '#11111b', border: '1px solid #222', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#fff' }}>
                        {movie.title || movie.name || strings.movieTitlePlaceholder}
                      </h4>
                      { (movie.date || movie.watched_at) && (
                        <span style={{ fontSize: '0.8rem', color: '#777' }}>
                          {strings.dateText} {movie.date || new Date(movie.watched_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {movie.duration && (
                      <span style={{ backgroundColor: '#222', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                        {movie.duration} {typeof movie.duration === 'number' ? strings.minsUnit : ''}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#11111b', borderTop: '1px solid #2a2a3d', textAlign: 'right' }}>
              <button className="primary-btn" onClick={() => setShowHistory(false)} style={{ backgroundColor: '#e50914', padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
                {strings.closeBtn}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default UserProfile;