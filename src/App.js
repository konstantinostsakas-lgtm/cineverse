import React, { useState, useEffect } from 'react';
import { Trophy, User, Film, Search, LogOut, LogIn, Eye, Type, Check, X, Globe, AlertCircle, RefreshCw } from 'lucide-react';

import Navbar from './components/Navbar'; 
import Home from './components/Home';
import MovieCard from './components/MovieCard';
import WatchParty from './components/WatchParty'; 
import MovieDetails from './components/MovieDetails'; 
import UserProfile from './components/UserProfile'; 
import Login from './components/Login'; 
import FriendsPanel from './components/FriendsPanel'; 
import { io } from 'socket.io-client';

// 📡 Σύνδεση με το Live Node.js Backend Server
const socket = io('http://localhost:5000');

// 🌐 ΛΕΞΙΚΟ ΜΕΤΑΦΡΑΣΕΩΝ (ΜΟΝΟ ΕΛΛΗΝΙΚΑ & ΑΓΓΛΙΚΑ)
const UI_STRINGS = {
  el: {
    home: "Αρχική",
    championship: "Championship",
    accessibility: "Προσβασιμότητα",
    translate: "Μετάφραση",
    searchPlaceholder: "Αναζήτηση ταινίας...",
    popularMovies: "Δημοφιλείς Ταινίες",
    category: "Κατηγορία",
    noMovies: "Δεν βρέθηκαν live ταινίες.",
    loginRegister: "Σύνδεση / Εγγραφή",
    guestReturn: "Επιστροφή ως Επισκέπτης",
    authRequired: "Απαιτείται Σύνδεση",
    authDesc: "Για να αποκτήσετε πρόσβαση στις ταινίες, στα Watch Parties και στα XP του Cineverse, πρέπει να συνδεθείτε στο λογαριασμό σας.",
    loginBtn: "Σύνδεση",
    cancelBtn: "Ακύρωση",
    textSize: "Μέγεθος Κειμένου",
    highContrast: "Υψηλή Αντίθεση",
    colorBlind: "Φίλτρο Αχρωματοψίας",
    cbNone: "Καμία",
    cbProtanopia: "Πρωτανοπία (Κόκκινο)",
    cbDeuteranopia: "Δευτερανοπία (Πράσινο)",
    cbTritanopia: "Τριτανοπία (Μπλε)",
    loadingTrans: "Μετάφραση περιεχομένου...",
    transError: "Σφάλμα κατά τη μετάφραση. Δοκιμάστε ξανά.",
    logout: "Αποσύνδεση",
    champTitle: "🏆 Cineverse Championship",
    champSubtitle: "Οι κορυφαίοι σινεφίλ της εβδομάδας!",
    you: "Εσείς",
    genres: {
      all: "🎬 Όλες",
      action: "💥 Δράση",
      comedy: "😂 Κωμωδία",
      horror: "👻 Τρόμου",
      scifi: "🚀 Επ. Φαντασία",
      romance: "❤️ Ρομαντικές"
    }
  },
  en: {
    home: "Home",
    championship: "Championship",
    accessibility: "Accessibility",
    translate: "Translate",
    searchPlaceholder: "Search movie...",
    popularMovies: "Popular Movies",
    category: "Category",
    noMovies: "No live movies found.",
    loginRegister: "Login / Register",
    guestReturn: "Return as Guest",
    authRequired: "Login Required",
    authDesc: "To access movies, Watch Parties, and Cineverse XP, you need to log into your account.",
    loginBtn: "Login",
    cancelBtn: "Cancel",
    textSize: "Text Size",
    highContrast: "High Contrast",
    colorBlind: "Color Blindness",
    cbNone: "None",
    cbProtanopia: "Protanopia (Red)",
    cbDeuteranopia: "Deuteranopia (Green)",
    cbTritanopia: "Tritanopia (Blue)",
    loadingTrans: "Translating content...",
    transError: "Translation error. Please try again.",
    logout: "Logout",
    champTitle: "🏆 Cineverse Championship",
    champSubtitle: "Top cinephiles of the week!",
    you: "You",
    genres: {
      all: "🎬 All",
      action: "💥 Action",
      comedy: "😂 Comedy",
      horror: "👻 Horror",
      scifi: "🚀 Sci-Fi",
      romance: "❤️ Romance"
    }
  }
};

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cineverse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [isWatchPartyActive, setIsWatchPartyActive] = useState(false); 
  const [currentPage, setCurrentPage] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // 🛠️ ΣΥΓΧΡΟΝΙΣΜΕΝΑ ACCESSIBILITY STATES
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(() => {
    return Number(localStorage.getItem('cineverse_font_scale')) || 1;
  });
  
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('cineverse_high_contrast') === 'true';
  });

  const [colorBlindness, setColorBlindness] = useState(() => {
    return localStorage.getItem('cineverse_color_blindness') || 'none';
  });

  // 🆕 STATE ΓΙΑ ΤΟ AUTH MODAL
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 🌐 TRANSLATION STATES
  const [currentLang, setCurrentLang] = useState(() => {
    // Αν η αποθηκευμένη γλώσσα ήταν τα ισπανικά, κάνει fallback στα ελληνικά
    const savedLang = localStorage.getItem('cineverse_lang');
    return savedLang === 'es' ? 'el' : (savedLang || 'el');
  });
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(false);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  // ⚙️ ΕΝΙΣΧΥΜΕΝΟ EFFECT ΓΙΑ ΠΛΗΡΗ ΠΡΟΣΒΑΣΙΜΟΤΗΤΑ (Συνδυαστικά Φίλτρα)
  useEffect(() => {
    localStorage.setItem('cineverse_font_scale', fontSizeMultiplier);
    localStorage.setItem('cineverse_high_contrast', highContrast);
    localStorage.setItem('cineverse_color_blindness', colorBlindness);

    document.documentElement.style.fontSize = `${fontSizeMultiplier * 100}%`;
    
    let filterString = '';

    if (highContrast) {
      filterString += 'contrast(1.5) brightness(1.1) ';
      document.body.classList.add('high-contrast-active');
    } else {
      document.body.classList.remove('high-contrast-active');
    }

    if (colorBlindness === 'protanopia') {
      filterString += 'hue-rotate(-20deg) saturate(1.3) ';
    } else if (colorBlindness === 'deuteranopia') {
      filterString += 'hue-rotate(30deg) saturate(1.3) ';
    } else if (colorBlindness === 'tritanopia') {
      filterString += 'hue-rotate(180deg) saturate(1.5) ';
    }

    document.body.style.filter = filterString.trim() || 'none';

  }, [fontSizeMultiplier, highContrast, colorBlindness]);

  // 📡 EFFECT ΓΙΑ LIVE ΔΕΔΟΜΕΝΑ (API & WEBSOCKETS)
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // ✅ Αφαιρέθηκαν τα Ισπανικά από το API mapping
        const tmdbLang = currentLang === 'en' ? 'en-US' : 'el-GR';
        
        let url = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=${tmdbLang}&page=1`;
        if (selectedGenre !== 'all') {
          url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=${tmdbLang}&with_genres=${selectedGenre}&sort_by=popularity.desc&page=1`;
        }
        const response = await fetch(url);
        const data = await response.json();
        setMovies(data.results || []);
      } catch (error) {
        console.error("Σφάλμα TMDB API:", error);
      }
    };
    fetchMovies();

    const targetUserId = user ? user.id : 'guest';
    socket.emit('get-initial-data', targetUserId); 

    socket.on('initial-data-res', (data) => {
      if (data.profile && user) {
        setUserProfile(data.profile);
      }
      setLeaderboard(data.leaderboard || []);
    });

    socket.on('profile-update', (updatedProfile) => {
      if (user) {
        setUserProfile(prev => ({ ...prev, ...updatedProfile }));
      }
    });

    socket.on('leaderboard-update', (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
    });

    return () => {
      socket.off('initial-data-res');
      socket.off('profile-update');
      socket.off('leaderboard-update');
    };
  }, [API_KEY, selectedGenre, user, currentLang]);

  const handleLogout = () => {
    localStorage.removeItem('cineverse_user'); 
    localStorage.removeItem('cineverse_token'); 
    setUser(null); 
    setUserProfile(null);
    setSelectedMovieId(null);
    setIsWatchPartyActive(false);
    setCurrentPage('home');
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setCurrentPage('home');
  };

  const handleSimulateXp = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    socket.emit('add-xp', { userId: user.id, amount: 150 });
  };

  const handleMovieSelect = (id) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedMovieId(id);
    setIsWatchPartyActive(false); 
    setCurrentPage('home'); 
  };

  const handleLanguageChange = (langKey) => {
    setIsTranslating(true);
    setTranslationError(false);
    setShowTranslateMenu(false);

    setTimeout(() => {
      try {
        if (!UI_STRINGS[langKey]) {
          throw new Error("Unsupported language setup");
        }
        setCurrentLang(langKey);
        localStorage.setItem('cineverse_lang', langKey);
        setIsTranslating(false);
      } catch (err) {
        setTranslationError(true);
        setIsTranslating(false);
      }
    }, 600);
  };

  const t = UI_STRINGS[currentLang] || UI_STRINGS.el;

  const dynamicGenres = [
    { id: 'all', name: t.genres.all },
    { id: 28, name: t.genres.action },
    { id: 35, name: t.genres.comedy },
    { id: 27, name: t.genres.horror },
    { id: 878, name: t.genres.scifi },
    { id: 1074, name: t.genres.romance }
  ];

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: highContrast ? '#000' : '#0b0b12' }}>
      
      {/* 🌐 GLOBAL TRANSLATION LOADING OVERLAY */}
      {isTranslating && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,11,18,0.85)', zIndex: 30000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <RefreshCw size={40} className="animate-spin" style={{ color: '#e50914', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{t.loadingTrans}</p>
        </div>
      )}

      {/* 🌐 TRANSLATION ERROR BANNER */}
      {translationError && (
        <div style={{ backgroundColor: '#e50914', color: '#fff', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'between', gap: '10px', fontSize: '0.95rem', fontWeight: 600, zIndex: 29999 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{t.transError}</span>
          </div>
          <button onClick={() => setTranslationError(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* 🆕 AUTH REQUIRED MODAL POPUP */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#161622', border: '1px solid #333', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: 'rgba(229,9,20,0.1)', padding: '1rem', borderRadius: '50%' }}>
                <Film size={40} style={{ color: '#e50914' }} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{t.authRequired}</h3>
            <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>{t.authDesc}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => { setShowAuthModal(false); setCurrentPage('login'); }}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', backgroundColor: '#e50914', color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
              >
                {t.loginBtn}
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: '#ccc', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
              >
                {t.cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 ΚΕΝΤΡΙΚΟ NAVIGATION BAR */}
      <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: highContrast ? '#000' : '#0b0b12', borderBottom: '1px solid #222', position: 'relative' }}>
        <div onClick={() => { setCurrentPage('home'); setSelectedMovieId(null); setIsWatchPartyActive(false); setSearchQuery(''); setSelectedGenre('all'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Film size={28} style={{ color: '#e50914' }} />
          <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px', color: '#fff' }}>CINEVERSE</span>
        </div>
        
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => { setCurrentPage('home'); setSelectedMovieId(null); setIsWatchPartyActive(false); }} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: currentPage === 'home' && !selectedMovieId ? '#e50914' : '#fff', 
              fontWeight: 700, 
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '0.5rem 0.2rem',
              position: 'relative',
              transition: 'color 0.3s ease, transform 0.2s ease',
              borderBottom: currentPage === 'home' && !selectedMovieId ? '2px solid #e50914' : '2px solid transparent'
            }}
          >
            {t.home}
          </button>
          
          <button 
            onClick={() => setCurrentPage('championship')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: currentPage === 'championship' ? '#ffd700' : '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontWeight: 700, 
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '0.5rem 0.2rem',
              borderBottom: currentPage === 'championship' ? '2px solid #ffd700' : '2px solid transparent'
            }}
          >
            <Trophy size={16} /> {t.championship}
          </button>

          {/* ♿ ACCESSIBILITY MENU */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => { setShowAccessMenu(!showAccessMenu); setShowTranslateMenu(false); }}
              style={{ background: 'none', border: 'none', color: showAccessMenu ? '#e50914' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '1rem', padding: '0.5rem 0.2rem' }}
              title={t.accessibility}
            >
              <Eye size={18} /> {t.accessibility}
            </button>

            {showAccessMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', backgroundColor: '#181824', width: '280px', padding: '1.2rem', borderRadius: '14px', border: '1px solid #333', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 10000 }}>
                
                {/* 1. Μέγεθος Κειμένου */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}><Type size={14}/> {t.textSize}:</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[
                      { label: 'A', scale: 1 },
                      { label: 'A+', scale: 1.15 },
                      { label: 'A++', scale: 1.3 }
                    ].map((btn) => (
                      <button
                        key={btn.scale}
                        onClick={() => setFontSizeMultiplier(btn.scale)}
                        style={{ flex: 1, padding: '6px 0', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: fontSizeMultiplier === btn.scale ? '#e50914' : '#222', color: '#fff', fontSize: '0.85rem' }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Υψηλή Αντίθεση */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '5px', borderTop: '1px solid #2b2b3d' }}>
                  <span style={{ fontSize: '0.85rem', color: '#aaa' }}>{t.highContrast}:</span>
                  <button
                    onClick={() => setHighContrast(!highContrast)}
                    style={{ width: '50px', height: '26px', borderRadius: '13px', backgroundColor: highContrast ? '#10b981' : '#444', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: highContrast ? '27px' : '3px', transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {highContrast && <Check size={12} color="#10b981" />}
                    </div>
                  </button>
                </div>

                {/* 3. Φίλτρο Αχρωματοψίας */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '5px', borderTop: '1px solid #2b2b3d' }}>
                  <span style={{ fontSize: '0.85rem', color: '#aaa' }}>{t.colorBlind}:</span>
                  <select
                    value={colorBlindness}
                    onChange={(e) => setColorBlindness(e.target.value)}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="none">{t.cbNone}</option>
                    <option value="protanopia">{t.cbProtanopia}</option>
                    <option value="deuteranopia">{t.cbDeuteranopia}</option>
                    <option value="tritanopia">{t.cbTritanopia}</option>
                  </select>
                </div>

              </div>
            )}
          </div>

          {/* 🌐 TRANSLATE MENU */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => { setShowTranslateMenu(!showTranslateMenu); setShowAccessMenu(false); }}
              style={{ background: 'none', border: 'none', color: showTranslateMenu ? '#e50914' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '1rem', padding: '0.5rem 0.2rem' }}
              title={t.translate}
            >
              <Globe size={18} /> {t.translate}
            </button>

            {showTranslateMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', backgroundColor: '#181824', width: '180px', padding: '0.5rem', borderRadius: '10px', border: '1px solid #333', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10000 }}>
                {/* ✅ Αφαιρέθηκαν τα Ισπανικά από τη λίστα επιλογών */}
                {[
                  { id: 'el', name: '🇬🇷 Ελληνικά' },
                  { id: 'en', name: '🇬🇧 English' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, textAlign: 'left', backgroundColor: currentLang === lang.id ? 'rgba(229,9,20,0.15)' : 'transparent', color: currentLang === lang.id ? '#e50914' : '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => { if(currentLang !== lang.id) e.currentTarget.style.backgroundColor = '#222'; }}
                    onMouseLeave={(e) => { if(currentLang !== lang.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span>{lang.name}</span>
                    {currentLang === lang.id && <Check size={16} style={{ color: '#e50914' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              <button 
                onClick={() => setCurrentPage('profile')} 
                style={{ 
                  backgroundColor: currentPage === 'profile' ? '#e50914' : '#16161f', 
                  border: currentPage === 'profile' ? '1px solid #e50914' : '1px solid #333', 
                  color: '#fff', 
                  borderRadius: '20px', 
                  padding: '0.5rem 1.2rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: currentPage === 'profile' ? '0 0 15px rgba(229, 9, 20, 0.4)' : 'none'
                }}
              >
                <span>{user.avatar}</span> 
                {userProfile ? userProfile.name : user.name} 
                {userProfile && <span style={{ fontSize: '0.8rem', color: currentPage === 'profile' ? '#fff' : '#ffd700', fontWeight: 'bold' }}>({userProfile.xp} XP)</span>}
              </button>
              
              <button 
                onClick={handleLogout} 
                title={t.logout} 
                style={{ background: 'none', border: 'none', color: '#e50914', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setCurrentPage('login')} 
              style={{ backgroundColor: '#e50914', border: 'none', color: '#fff', borderRadius: '20px', padding: '0.5rem 1.4rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <LogIn size={16} /> {t.loginRegister}
            </button>
          )}
        </nav>
      </header>

      {/* 🌟 ΔΙΑΧΕΙΡΙΣΗ ΣΕΛΙΔΩΝ */}
      <div style={{ flex: 1 }}>
        {currentPage === 'login' ? (
          <div style={{ marginTop: '2rem' }}>
            <Login onLoginSuccess={handleLoginSuccess} />
            <div style={{ textCenter: 'center', marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setCurrentPage('home')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>
                {t.guestReturn}
              </button>
            </div>
          </div>
        ) : currentPage === 'profile' ? (
          user ? (
            <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
              <UserProfile profile={userProfile} leaderboard={leaderboard} onBackToHome={() => setCurrentPage('home')} onSimulateXp={handleSimulateXp} currentLang={currentLang} t={t} />
              <FriendsPanel currentUserId={user.id} socket={socket} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#fff', padding: '5rem' }}>
              <h2>{t.authRequired}</h2>
              <button onClick={() => setCurrentPage('login')} style={{ backgroundColor: '#e50914', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', marginTop: '1rem', cursor: 'pointer' }}>{t.loginBtn}</button>
            </div>
          )
        ) : currentPage === 'championship' ? (
          <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1rem', color: '#fff' }}>
            <h1 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffd700' }}>{t.champTitle}</h1>
            <p style={{ textAlign: 'center', color: '#888', marginBottom: '2rem' }}>{t.champSubtitle}</p>
            
            <div style={{ backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
              {leaderboard.map((u, index) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: index !== leaderboard.length - 1 ? '1px solid #222' : 'none', backgroundColor: user && u.id === user.id ? 'rgba(30,64,175,0.15)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, width: '30px', color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666' }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontSize: '2rem' }}>{u.avatar}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{u.name} {user && u.id === user.id && <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>({t.you})</span>}</div>
                      <div style={{ fontSize: '0.85rem', color: '#888' }}>{u.rank}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#ffd700' }}>{u.xp} XP</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 🎬 ΚΕΝΤΡΙΚΗ ΔΙΑΧΕΙΡΙΣΗ ΤΑΙΝΙΩΝ */
          selectedMovieId ? (
            isWatchPartyActive ? (
              <WatchParty 
                movieId={selectedMovieId} 
                user={{ id: user.id, name: userProfile?.name || user.name, avatar: userProfile?.avatar || user.avatar }} 
                socket={socket} 
                movieUrl={`https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`} 
              />
            ) : (
              <MovieDetails 
                movieId={selectedMovieId} 
                onBackToHome={() => setSelectedMovieId(null)} 
                onStartWatchParty={() => setIsWatchPartyActive(true)} 
                currentUserId={user?.id} 
                currentLang={currentLang}
                t={t}
              />
            )
          ) : (
            /* 🎬 HOME COMPONENT LAYOUT */
            <div style={{ padding: '0 2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', margin: '2rem 0 1rem 0' }}>
                
                {/* 🔍 Μπάρα Αναζήτησης */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                  <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                </div>

                {/* 🔽 Drop Down Menu για τα είδη των ταινιών */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label htmlFor="genre-select" style={{ color: '#aaa', fontSize: '0.95rem', fontWeight: 600 }}>🍿 {t.category}:</label>
                  <select 
                    id="genre-select"
                    value={selectedGenre} 
                    onChange={(e) => { setSelectedGenre(e.target.value); setSelectedMovieId(null); }}
                    style={{ 
                      padding: '0.6rem 1.5rem', 
                      backgroundColor: '#111', 
                      color: '#fff', 
                      border: '1px solid #333', 
                      borderRadius: '8px', 
                      fontSize: '0.95rem', 
                      fontWeight: 600, 
                      cursor: 'pointer', 
                      outline: 'none' 
                    }}
                  >
                    {dynamicGenres.map((genre) => (
                      <option key={genre.id} value={genre.id} style={{ backgroundColor: '#111', color: '#fff' }}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* 🎯 Home Component Layout */}
              <Home 
                onMovieClick={handleMovieSelect} 
                searchQuery={searchQuery} 
                selectedGenre={selectedGenre} 
                currentLanguage={currentLang} 
                t={t}
              />
            </div>
          )
        )}
      </div>

    </div>
  );
}

export default App;