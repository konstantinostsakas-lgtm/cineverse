import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Send, Calendar, Clock, Star, Play, Trophy } from 'lucide-react';
import ReactPlayer from 'react-player'; 
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', { autoConnect: false });

function MovieDetails({ movieId, onBackToHome }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWatchParty, setIsWatchParty] = useState(false); // Δείχνει αν ο player είναι ανοιχτός γενικά
  const [isPartyMode, setIsPartyMode] = useState(false);   // Δείχνει αν είμαστε σε Watch Party ή Μόνοι μας
  const [xpAwarded, setXpAwarded] = useState(false);       // Για να μην παίρνει ο χρήστης άπειρα XP κάνοντας κλικ
  
  // Real-time έλεγχος του Player & Chat Scroll
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null); 
  const messagesEndRef = useRef(null); // 🛠️ Ref για αυτόματο scroll στο chat
  
  const isInternalAction = useRef(false);

  // Εγγυημένο YouTube Link για τις δοκιμές
  const REAL_VIDEO_URL = "https://www.youtube.com/watch?v=Bey4XXJAqS8";
  
  const [messages, setMessages] = useState([
    { id: 'm1', user: "Γιώργος (Πρωτανωπία)", text: "Καλή αρχή! Η ποιότητα είναι τέλεια." },
    { id: 'm2', user: "Κατερίνα (Cinephile)", text: "Αυτή η σκηνή έχει απίστευτη μουσική επένδυση!" }
  ]);
  const [inputText, setInputText] = useState("");

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

  // 🛠️ Εφέ για αυτόματο scroll στο κάτω μέρος του chat κάθε φορά που αλλάζουν τα μηνύματα
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=el-GR`);
        const data = await response.json();

        if (data.success === false) {
          setMovie(null);
        } else {
          const formatDuration = (minutes) => {
            if (!minutes) return 'N/A';
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return hours > 0 ? `${hours}ώ ${mins}λ` : `${mins}λ`;
          };

          setMovie({
            id: data.id,
            title: data.title,
            overview: data.overview || 'Δεν υπάρχει διαθέσιμη περιγραφή στα Ελληνικά.',
            image: data.backdrop_path ? `${IMAGE_BASE_URL}${data.backdrop_path}` : 'https://via.placeholder.com/1920x1080?text=No+Image',
            poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            rating: data.vote_average ? data.vote_average.toFixed(1) : '0.0',
            year: data.release_date ? data.release_date.split('-')[0] : 'N/A',
            duration: formatDuration(data.runtime)
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των λεπτομερειών της ταινίας:", error);
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId, API_KEY]);

  // WebSockets Real-time συγχρονισμός
  useEffect(() => {
    if (isWatchParty) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('join-room', movieId);

      if (isPartyMode) {
        socket.on('receive-message', (incomingMsg) => {
          setMessages((prevMessages) => [...prevMessages, incomingMsg]);
        });

        socket.on('video-control-client', (data) => {
          isInternalAction.current = true;

          if (data.action === 'play') {
            setTimeout(() => {
              setIsPlaying(true);
              if (data.currentTime && playerRef.current) {
                playerRef.current.seekTo(data.currentTime, 'seconds');
              }
            }, 100);
          } else if (data.action === 'pause') {
            setIsPlaying(false);
          }
        });
      }
    }

    return () => {
      socket.off('receive-message');
      socket.off('video-control-client');
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [isWatchParty, isPartyMode, movieId]); // 🛠️ Ασφαλές dependency array χωρίς διπλότυπα listeners

  // ΕΠΙΛΟΓΗ 1: Παρακολούθηση Μόνος μου (Solo Mode)
  const handleStartSoloWatch = () => {
    setIsWatchParty(true);
    setIsPartyMode(false); 
    setIsPlaying(false);
  };

  // ΕΠΙΛΟΓΗ 2: Παρακολούθηση με Παρέα (Watch Party)
  const handleStartWatchParty = () => {
    setIsWatchParty(true);
    setIsPartyMode(true);  
    setIsPlaying(false); 
  };

  // 🏆 Λειτουργία επιβράβευσης XP όταν ο χρήστης δει τουλάχιστον ένα μέρος της ταινίας
  const handleVideoProgress = (state) => {
    if (state.playedSeconds > 5 && !xpAwarded) {
      setXpAwarded(true);
      socket.emit('add-xp', { userId: 'user_1', amount: 100 });
      alert("🏆 Συγχαρητήρια! Κέρδισες +100 XP στο Championship για την προβολή της ταινίας!");
    }
  };

  const handleVideoPlay = () => {
    if (!isPartyMode) {
      setIsPlaying(true);
      return;
    }

    if (isInternalAction.current) {
      isInternalAction.current = false;
      return;
    }

    setIsPlaying(true);
    const currentTime = playerRef.current ? playerRef.current.getCurrentTime() : 0;
    
    socket.emit('video-control', {
      roomId: movieId,
      action: 'play',
      currentTime: currentTime
    });
  };

  const handleVideoPause = () => {
    if (!isPartyMode) {
      setIsPlaying(false);
      return;
    }

    if (isInternalAction.current) {
      isInternalAction.current = false;
      return;
    }

    setIsPlaying(false);
    socket.emit('video-control', {
      roomId: movieId,
      action: 'pause'
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg = {
      id: Date.now().toString(),
      user: "Εσείς (Ήφαιστος)",
      text: inputText
    };
    
    setMessages((prevMessages) => [...prevMessages, newMsg]);
    socket.emit('send-message', { roomId: movieId, message: newMsg, userId: 'user_1' });
    setInputText("");
  };

  // 🛠️ Συναρτήση ασφαλούς εξόδου στην Αρχική Σελίδα
  const handleBackAction = () => {
    setIsWatchParty(false);
    setIsPlaying(false);
    onBackToHome();
  };

  if (loading) return <div style={{ color: '#fff', padding: '4rem', textAlign: 'center' }}>Φόρτωση λεπτομερειών...</div>;
  if (!movie) return <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}><p>Η ταινία δεν βρέθηκε.</p></div>;

  return (
    <div className={`details-container ${isWatchParty && isPartyMode ? 'watch-party-active' : ''}`}>
      
      <main className="details-main" style={{ backgroundImage: `url(${movie.image})` }}>
        <div className="details-wrapper">
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1.5rem' }}>
            
            <button className="primary-btn" onClick={handleBackAction} style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #444', alignSelf: 'flex-start' }}>
              <ArrowLeft size={18} /> Πίσω στην Αρχική
            </button>

            {/* Ο VIDEO PLAYER */}
            {isWatchParty ? (
              <div className="video-player-real-wrapper" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '16/9' }}>
                <ReactPlayer
                  ref={playerRef}
                  url={REAL_VIDEO_URL}
                  playing={isPlaying}
                  controls={true}
                  width="100%"
                  height="100%"
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onProgress={handleVideoProgress} 
                />
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {!isWatchParty && (
                <img src={movie.poster} alt={`Αφίσα ${movie.title}`} className="poster-large" style={{ width: '250px', borderRadius: '8px' }} />
              )}
              
              <div className="details-info" style={{ flex: 1, minWidth: '300px' }}>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 800 }}>{movie.title}</h1>
                
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={16} /> <span>{movie.year}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={16} /> <span>{movie.duration}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Star size={16} fill="#ffd700" color="#ffd700" /> 
                    <span style={{ color: '#fff', fontWeight: 700 }}>{movie.rating}/10</span>
                  </div>
                </div>

                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#e0e0e0', marginTop: '0.5rem' }}>
                  {movie.overview}
                </p>

                {/* ΤΑ ΔΥΟ ΚΟΥΜΠΙΑ */}
                {!isWatchParty && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button className="primary-btn" onClick={handleStartSoloWatch} style={{ backgroundColor: '#e50914' }}>
                      <Play size={18} fill="#fff" /> Απλή Αναπαραγωγή
                    </button>
                    <button className="primary-btn" onClick={handleStartWatchParty} style={{ backgroundColor: '#1e40af' }}>
                      <Users size={18} /> Έναρξη Watch Party
                    </button>
                  </div>
                )}

                {isWatchParty && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                    <span>Κατάσταση:</span> 
                    <strong style={{ color: '#fff' }}>
                      {isPartyMode ? "👥 Watch Party Ενεργό" : "🎬 Προβολή Μόνος"}
                    </strong>
                    <span style={{ fontSize: '0.85rem', backgroundColor: '#222', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#ffd700' }}>
                      <Trophy size={12} /> XP Active
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Live Chat Sidebar */}
      {isWatchParty && isPartyMode && (
        <aside className="watch-sidebar" aria-label="Live Chat Δωματίου">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--accent-blue)' }} />
              <span>Watch Party Chat (Συνδεδεμένος)</span>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className="chat-bubble">
                <div className="chat-user">{msg.user}</div>
                <div style={{ color: '#fff' }}>{msg.text}</div>
              </div>
            ))}
            {/* 🛠️ Αόρατο div για να κατευθύνει το smooth scroll στο τέλος */}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              className="chat-input"
              placeholder="Γράψτε ένα μήνυμα..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="icon-btn" style={{ background: 'var(--accent-blue)', borderRadius: '4px' }}>
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}

    </div>
  );
}

export default MovieDetails;