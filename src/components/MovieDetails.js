import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Send, Play, Calendar, Clock, Star } from 'lucide-react';

function MovieDetails({ movieId, onBackToHome }) {
  // State για τα live δεδομένα της ταινίας από το API
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // State για την ενεργοποίηση του Watch Party (Split-Screen 70/30)
  const [isWatchParty, setIsWatchParty] = useState(false);
  
  // States για το Chat της Sidebar
  const [messages, setMessages] = useState([
    { id: 1, user: "Γιώργος (Πρωτανωπία)", text: "Καλή αρχή! Η ποιότητα είναι τέλεια." },
    { id: 2, user: "Κατερίνα (Cinephile)", text: "Αυτή η σκηνή έχει απίστευτη μουσική επένδυση!" }
  ]);
  const [inputText, setInputText] = useState("");

  // Ρυθμίσεις API
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

  // Fetch τις λεπτομέρειες της ταινίας από το TMDB όταν αλλάζει το movieId
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=el-GR`);
        const data = await response.json();

        if (data.success === false) {
          setMovie(null);
        } else {
          // Μετατροπή των λεπτών σε μορφή "Xώ Yλ" (π.χ. 130 -> 2ώ 10λ)
          const formatDuration = (minutes) => {
            if (!minutes) return 'N/A';
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return hours > 0 ? `${hours}ώ ${mins}λ` : `${mins}λ`;
          };

          // Προσαρμογή των δεδομένων στη δομή του component σου
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

  // Χειρισμός αποστολής μηνύματος στο Live Chat
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg = {
      id: messages.length + 1,
      user: "Εσείς (Ήφαιστος)",
      text: inputText
    };
    
    setMessages([...messages, newMsg]);
    setInputText("");
  };

  // 1. Fallback UI κατά τη διάρκεια της φόρτωσης
  if (loading) {
    return <div style={{ color: '#fff', padding: '4rem', textAlign: 'center' }}>Φόρτωση λεπτομερειών...</div>;
  }

  // 2. Fallback UI αν δεν βρεθεί η ταινία στο API
  if (!movie) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>
        <p>Η ταινία δεν βρέθηκε.</p>
        <button className="primary-btn" onClick={onBackToHome} style={{ marginTop: '1rem', display: 'inline-flex' }}>
          Επιστροφή στην Αρχική
        </button>
      </div>
    );
  }

  return (
    <div className={`details-container ${isWatchParty ? 'watch-party-active' : ''}`}>
      
      {/* ΚΥΡΙΟ ΜΕΡΟΣ: Πληροφορίες Ταινίας ή Video Player (70% σε Watch Party Layout) */}
      <main className="details-main" style={{ backgroundImage: `url(${movie.image})` }}>
        <div className="details-wrapper">
          
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1.5rem' }}>
            {/* Κουμπί Επιστροφής */}
            <button 
              className="primary-btn" 
              onClick={onBackToHome}
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #444', alignSelf: 'flex-start' }}
              aria-label="Επιστροφή στην αρχική σελίδα"
            >
              <ArrowLeft size={18} /> Πίσω στην Αρχική
            </button>

            {/* Αν το Watch Party είναι ενεργό, εμφανίζεται ο Video Player στην κορυφή */}
            {isWatchParty ? (
              <div className="video-player-mock">
                <div style={{ textAlign: 'center' }}>
                  <Play size={48} style={{ color: 'var(--accent-red)', marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
                  <p style={{ fontWeight: 600 }}>Συγχρονισμένη Αναπαραγωγή σε Εξέλιξη (WebRTC Simulated)</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>00:14 / {movie.duration}</p>
                </div>
              </div>
            ) : null}

            {/* Παρουσίαση Στοιχείων Ταινίας (Poster, Τίτλος, Περιγραφή) */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {!isWatchParty && (
                <img src={movie.poster} alt={`Αφίσα ${movie.title}`} className="poster-large" style={{ width: '250px', borderRadius: '8px' }} />
              )}
              
              <div className="details-info" style={{ flex: 1, minWidth: '300px' }}>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 800 }}>{movie.title}</h1>
                
                {/* Meta Badges */}
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

                {/* Διαδραστικά Κουμπιά */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button className="primary-btn" onClick={() => setIsWatchParty(true)}>
                    <Play size={18} fill="#fff" /> {isWatchParty ? "Επανεκκίνηση Ταινίας" : "Παρακολούθηση Τώρα"}
                  </button>
                  
                  {!isWatchParty && (
                    <button 
                      className="primary-btn" 
                      onClick={() => setIsWatchParty(true)}
                      style={{ backgroundColor: '#0071eb' }}
                    >
                      <Users size={18} /> Έναρξη Watch Party
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ΔΕΞΙ ΜΕΡΟΣ: Social Chat Sidebar */}
      {isWatchParty && (
        <aside className="watch-sidebar" aria-label="Live Chat Δωματίου">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--accent-blue)' }} />
              <span>Watch Party Chat (3 μέλη)</span>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className="chat-bubble">
                <div className="chat-user">{msg.user}</div>
                <div style={{ color: '#fff' }}>{msg.text}</div>
              </div>
            ))}
          </div>

          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              className="chat-input"
              placeholder="Γράψτε ένα μήνυμα..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              aria-label="Κείμενο μηνύματος συνομιλίας"
            />
            <button type="submit" className="icon-btn" style={{ background: 'var(--accent-blue)', borderRadius: '4px' }} title="Αποστολή">
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}

    </div>
  );
}

export default MovieDetails;