import React, { useState, useEffect } from 'react';
import { Trophy, User, Film, Search, LogOut } from 'lucide-react';
import MovieCard from './components/MovieCard';
import MovieDetails from './components/MovieDetails';
import UserProfile from './components/UserProfile'; 
import Login from './components/Login'; // 🛠️ Εισαγωγή της σελίδας Login
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const GENRES = [
  { id: 'all', name: '🎬 Όλες' },
  { id: 28, name: '💥 Δράση' },
  { id: 35, name: '😂 Κωμωδία' },
  { id: 27, name: '👻 Τρόμου' },
  { id: 878, name: '🚀 Επ. Φαντασία' },
  { id: 1074, name: '❤️ Ρομαντικές' }
];

function App() {
  // 🛠️ State για Authentication (Έλεγχος αν υπάρχει αποθηκευμένος χρήστης)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cineverse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Real-time δεδομένα από τον Server
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  useEffect(() => {
    // Αν δεν υπάρχει συνδεδεμένος χρήστης, μην τραβάς ταινίες και μην συνδέεσαι στο socket
    if (!user) return;

    // 1. Φόρτωση Ταινιών από TMDB
    const fetchMovies = async () => {
      try {
        let url = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=el-GR&page=1`;
        if (selectedGenre !== 'all') {
          url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=el-GR&with_genres=${selectedGenre}&sort_by=popularity.desc&page=1`;
        }
        const response = await fetch(url);
        const data = await response.json();
        setMovies(data.results || []);
      } catch (error) {
        console.error("Σφάλμα TMDB:", error);
      }
    };
    fetchMovies();

    // 2. WebSockets: Σύνδεση με το ID 'user_1' για συμβατότητα με τον backend server
    socket.emit('get-initial-data', 'user_1'); 

    socket.on('initial-data-res', (data) => {
      // 🛠️ ΔΙΟΡΘΩΣΗ: Ενημερώνουμε το profile με το πραγματικό όνομα και avatar από το Register
      if (data.profile) {
        const mergedProfile = { ...data.profile, name: user.name, avatar: user.avatar };
        setUserProfile(mergedProfile);
      }
      setLeaderboard(data.leaderboard);
    });

    socket.on('profile-update', (updatedProfile) => {
      setUserProfile(prev => ({ ...prev, ...updatedProfile, name: user.name, avatar: user.avatar }));
    });

    socket.on('leaderboard-update', (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
    });

    return () => {
      socket.off('initial-data-res');
      socket.off('profile-update');
      socket.off('leaderboard-update');
    };
  }, [API_KEY, selectedGenre, user]); 

  // 🛠️ ΣΥΝΑΡΤΗΣΗ LOGOUT (ΑΠΟΣΥΝΔΕΣΗ)
  const handleLogout = () => {
    localStorage.removeItem('cineverse_user'); // Διαγραφή από τη μνήμη session
    setUser(null); // Επαναφορά της React στο Login screen
    setUserProfile(null);
    setSelectedMovieId(null);
    setCurrentPage('home');
  };

  // Αν ο χρήστης ΔΕΝ είναι συνδεδεμένος, δείξε ΜΟΝΟ την οθόνη Login
  if (!user) {
    return <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  const handleSimulateXp = () => {
    // Στέλνουμε 'user_1' στον server για να ξέρει ποιον να αναβαθμίσει στο leaderboard
    socket.emit('add-xp', { userId: 'user_1', amount: 150 });
  };

  const handleMovieSelect = (id) => {
    setSelectedMovieId(id);
    setCurrentPage('home'); 
  };

  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* 🌟 ΚΕΝΤΡΙΚΟ NAVIGATION BAR */}
      <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#0b0b12', borderBottom: '1px solid #222' }}>
        <div onClick={() => { setCurrentPage('home'); setSelectedMovieId(null); setSearchQuery(''); setSelectedGenre('all'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Film size={28} style={{ color: '#e50914' }} />
          <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px' }}>CINEVERSE</span>
        </div>
        
        <nav style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <button onClick={() => { setCurrentPage('home'); setSelectedMovieId(null); }} style={{ background: 'none', border: 'none', color: currentPage === 'home' && !selectedMovieId ? 'var(--accent-blue)' : '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Αρχική
          </button>
          
          <button onClick={() => setCurrentPage('championship')} style={{ background: 'none', border: 'none', color: currentPage === 'championship' ? '#ffd700' : '#fff', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, cursor: 'pointer' }}>
            <Trophy size={16} /> Championship
          </button>

          <button onClick={() => setCurrentPage('profile')} style={{ backgroundColor: '#222', border: '1px solid #333', color: '#fff', borderRadius: '20px', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span>{user.avatar}</span> {userProfile ? userProfile.name : user.name} {userProfile && <span style={{ fontSize: '0.8rem', color: '#ffd700' }}>({userProfile.xp} XP)</span>}
          </button>

          {/* 🛠️ ΚΟΥΜΠΙ LOGOUT ΣΤΟ NAV BAR */}
          <button 
            onClick={handleLogout} 
            title="Αποσύνδεση" 
            style={{ background: 'none', border: 'none', color: '#e50914', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px' }}
          >
            <LogOut size={18} />
          </button>
        </nav>
      </header>

      {/* 🌟 ΔΙΑΧΕΙΡΙΣΗ ΣΕΛΙΔΩΝ */}
      {currentPage === 'profile' ? (
        <UserProfile 
          profile={userProfile || user} 
          leaderboard={leaderboard} 
          onBackToHome={() => setCurrentPage('home')} 
          onSimulateXp={handleSimulateXp} 
        />
      ) : currentPage === 'championship' ? (
        /* 🏆 CHAMPIONSHIP */
        <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1rem', color: '#fff' }}>
          <h1 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffd700' }}>🏆 Cineverse Championship</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Οι κορυφαίοι σινεφίλ της εβδομάδας!</p>
          
          <div style={{ backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
            {leaderboard.map((u, index) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: index !== leaderboard.length - 1 ? '1px solid #222' : 'none', backgroundColor: u.id === 'user_1' ? 'rgba(30,64,175,0.15)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, width: '30px', color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666' }}>
                    #{index + 1}
                  </span>
                  {/* 🛠️ ΔΙΟΡΘΩΣΗ: Αντικαθιστούμε τα δεδομένα του 'user_1' στο leaderboard με το δικό μας Avatar και Όνομα */}
                  <span style={{ fontSize: '2rem' }}>{u.id === 'user_1' ? user.avatar : u.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{u.id === 'user_1' ? user.name : u.name} {u.id === 'user_1' && <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}>(Εσείς)</span>}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.rank}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: '#ffd700' }}>{u.xp} XP</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 🎬 ΑΡΧΙΚΗ ΣΕΛΙΔΑ */
        selectedMovieId ? (
          <MovieDetails movieId={selectedMovieId} onBackToHome={() => setSelectedMovieId(null)} />
        ) : (
          <main className="main-content" style={{ padding: '2rem' }}>
            
            {/* 🔍 ΜΠΑΡΑ ΑΝΑΖΗΤΗΣΗΣ */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input 
                  type="text"
                  placeholder="Αναζήτηση ταινίας..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* 🏷️ ΚΟΥΜΠΙΑ ΚΑΤΗΓΟΡΙΩΝ */}
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => { setSelectedGenre(genre.id); setSelectedMovieId(null); }}
                  style={{
                    padding: '0.5rem 1.2rem',
                    borderRadius: '20px',
                    border: '1px solid #333',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: selectedGenre === genre.id ? '#e50914' : '#111',
                    color: '#fff',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {genre.name}
                </button>
              ))}
            </div>

            <h2 className="section-title" style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {selectedGenre === 'all' ? "Δημοφιλείς Ταινίες" : `Ταινίες Κατηγορίας`}
            </h2>

            {/* GRID ΜΕ ΤΑΙΝΙΕΣ */}
            {filteredMovies.length > 0 ? (
              <div className="movies-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
                {filteredMovies.map(movie => (
                  <MovieCard 
                    key={movie.id} 
                    movie={movie} 
                    onSelectMovie={handleMovieSelect} 
                    onMovieClick={handleMovieSelect} 
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '3rem', fontSize: '1.1rem' }}>
                Δεν βρέθηκαν ταινίες με αυτό το όνομα.
              </div>
            )}
          </main>
        )
      )}
    </div>
  );
}

export default App;