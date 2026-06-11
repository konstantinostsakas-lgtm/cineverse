import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Send, Calendar, Clock, Star, Play, X, Check } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://https://cineverse-backend-vmof.onrender.com:5000', { autoConnect: false });

const COMPONENT_STRINGS = {
  el: {
    loading: "Φόρτωση...",
    notFound: "Η ταινία δεν βρέθηκε.",
    inviteFriends: "Πρόσκληση Φίλων",
    noFriends: "Δεν βρέθηκαν φίλοι.",
    confirmParty: "Επιβεβαίωση & Έναρξη Watch Party",
    backHome: "Πίσω στην Αρχική",
    noOverview: "Δεν υπάρχει περιγραφή.",
    soloWatch: "Απλή Αναπαραγωγή",
    startParty: "Έναρξη Watch Party",
    chatHeader: "Watch Party Chat",
    chatPlaceholder: "Μήνυμα...",
    you: "Εσείς",
    hoursUnit: "ώ",
    minsUnit: "λ"
  },
  en: {
    loading: "Loading...",
    notFound: "Movie not found.",
    inviteFriends: "Invite Friends",
    noFriends: "No friends found.",
    confirmParty: "Confirm & Start Watch Party",
    backHome: "Back to Home",
    noOverview: "No description available.",
    soloWatch: "Solo Watch",
    startParty: "Start Watch Party",
    chatHeader: "Watch Party Chat",
    chatPlaceholder: "Message...",
    you: "You",
    hoursUnit: "h",
    minsUnit: "m"
  }
};

function MovieDetails({ movieId, onBackToHome, onStartWatchParty, currentUserId, currentLang = 'el' }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWatchParty, setIsWatchParty] = useState(false); 
  const [isPartyMode, setIsPartyMode] = useState(false);   
  const [friends, setFriends] = useState([]);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

  const localLang = currentLang === 'en' ? 'en' : 'el';
  const strings = COMPONENT_STRINGS[localLang];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const tmdbLang = currentLang === 'en' ? 'en-US' : 'el-GR';
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=${tmdbLang}`);
        const data = await response.json();
        
        if (data.success !== false) {
          const formatDuration = (m) => {
            const h = Math.floor(m / 60);
            const mins = m % 60;
            return h > 0 ? `${h}${strings.hoursUnit} ${mins}${strings.minsUnit}` : `${mins}${strings.minsUnit}`;
          };
          setMovie({
            id: data.id,
            title: data.title,
            overview: data.overview || strings.noOverview,
            image: data.backdrop_path ? `${IMAGE_BASE_URL}${data.backdrop_path}` : null,
            poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            rating: data.vote_average ? data.vote_average.toFixed(1) : '0.0',
            year: data.release_date ? data.release_date.split('-')[0] : 'N/A',
            duration: formatDuration(data.runtime)
          });
        }
        if (currentUserId && currentUserId !== 'guest') {
          const friendsRes = await fetch(`http://https://cineverse-backend-vmof.onrender.com:5000/api/friends/list/${currentUserId}`);
          const friendsData = await friendsRes.json();
          setFriends(friendsData);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchData();
  }, [movieId, API_KEY, currentUserId, currentLang, strings.hoursUnit, strings.minsUnit, strings.noOverview]);

  useEffect(() => {
    if (isWatchParty && isPartyMode) {
      if (!socket.connected) socket.connect();
      socket.emit('join-room', movieId);
      socket.on('receive-message', (msg) => setMessages((prev) => [...prev, msg]));
    }
    return () => {
      socket.off('receive-message');
      if (socket.connected) socket.disconnect();
    };
  }, [isWatchParty, isPartyMode, movieId]);

  const handleStartSoloWatch = () => { setIsWatchParty(true); setIsPartyMode(false); };
  const handleStartWatchPartyClick = () => { setShowFriendSelector(true); };

  // Διαχείριση επιλογής/αποεπιλογής φίλου
  const handleToggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const confirmAndStartParty = () => {
    setShowFriendSelector(false);
    if (onStartWatchParty) {
      // Περνάμε και τους επιλεγμένους φίλους στο Watch Party component
      onStartWatchParty(movieId, selectedFriends);
    } else {
      setIsWatchParty(true);
      setIsPartyMode(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const localUser = JSON.parse(localStorage.getItem('cineverse_user') || '{}');
    const newMsg = { id: Date.now().toString(), user: localUser.username || strings.you, text: inputText };
    setMessages((prev) => [...prev, newMsg]);
    socket.emit('send-message', { roomId: movieId, message: newMsg, userId: localUser.id });
    setInputText("");
  };

  const handleBackAction = () => { setIsWatchParty(false); onBackToHome(); };

  if (loading) return <div style={{ color: '#fff', padding: '4rem', textAlign: 'center' }}>{strings.loading}</div>;
  if (!movie) return <div style={{ color: '#fff', textAlign: 'center' }}>{strings.notFound}</div>;

  return (
    <div className={`details-container ${isWatchParty && isPartyMode ? 'watch-party-active' : ''}`}>
      {showFriendSelector && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>{strings.inviteFriends}</h3>
              <X onClick={() => setShowFriendSelector(false)} style={{ cursor: 'pointer', color: '#666' }} />
            </div>
            
            {/* ΛΙΣΤΑ ΦΙΛΩΝ (SCROLLABLE) */}
            <div style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
              {friends && friends.length > 0 ? (
                friends.map(friend => {
                  const isSelected = selectedFriends.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => handleToggleFriend(friend.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#1c1c1c' : '#141414',
                        border: isSelected ? '1px solid #e50914' : '1px solid #252525',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={friend.avatar || 'https://via.placeholder.com/40'} 
                          alt={friend.name} 
                          style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #333' }} 
                        />
                        <span style={{ color: '#fff', fontWeight: '500', fontSize: '0.95rem' }}>{friend.name}</span>
                      </div>
                      {isSelected && <Check size={18} color="#e50914" strokeWidth={3} />}
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#666', textAlign: 'center', margin: '1.5rem 0', fontSize: '0.9rem' }}>{strings.noFriends}</p>
              )}
            </div>

            <button 
              onClick={confirmAndStartParty} 
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', backgroundColor: '#e50914', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#b9090b'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e50914'}
            >
              {strings.confirmParty} {selectedFriends.length > 0 && `(${selectedFriends.length})`}
            </button>
          </div>
        </div>
      )}

      <main className="details-main" style={{ backgroundImage: movie.image ? `url(${movie.image})` : 'none' }}>
        <div className="details-wrapper">
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1.5rem' }}>
            <button className="primary-btn" onClick={handleBackAction} style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #444', alignSelf: 'flex-start' }}>
              <ArrowLeft size={18} /> {strings.backHome}
            </button>

            {isWatchParty && (
              <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #444' }}>
                 <p style={{ color: '#666' }}>Video Player Placeholder (Static Mode)</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {!isWatchParty && movie.poster && <img src={movie.poster} alt={movie.title} className="poster-large" style={{ width: '250px', borderRadius: '8px' }} />}
              <div className="details-info" style={{ flex: 1, minWidth: '300px' }}>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 800 }}>{movie.title}</h1>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#e0e0e0' }}>{movie.overview}</p>
                {!isWatchParty && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="primary-btn" onClick={handleStartSoloWatch} style={{ backgroundColor: '#e50914' }}><Play size={18} fill="#fff" /> {strings.soloWatch}</button>
                    <button className="primary-btn" onClick={handleStartWatchPartyClick} style={{ backgroundColor: '#1e40af' }}><Users size={18} /> {strings.startParty}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MovieDetails;