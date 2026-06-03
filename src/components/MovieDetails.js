import React, { useState } from 'react';
import { moviesData } from '../data/movies';
import { ArrowLeft, Users, Send, Play, Calendar, Clock, Star } from 'lucide-react'; // HCI: Εικονίδια για άμεση αναγνώριση ενεργειών

function MovieDetails({ movieId, onBackToHome }) {
  // Εύρεση της ταινίας στη βάση δεδομένων με βάση το ID της
  const movie = moviesData.find(m => m.id === movieId);

  // State για την ενεργοποίηση του Watch Party (Split-Screen 70/30)
  const [isWatchParty, setIsWatchParty] = useState(false);
  
  // States για το Chat της Sidebar
  const [messages, setMessages] = useState([
    { id: 1, user: "Γιώργος (Πρωτανωπία)", text: "Καλή αρχή! Η ποιότητα είναι τέλεια." },
    { id: 2, user: "Κατερίνα (Cinephile)", text: "Αυτή η σκηνή έχει απίστευτη μουσική επένδυση!" }
  ]);
  const [inputText, setInputText] = useState("");

  // Χειρισμός αποστολής μηνύματος στο Live Chat
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg = {
      id: messages.length + 1,
      user: "Εσείς (Ήφαιστος)", // Χρήση του μυθολογικού profile avatar concept
      text: inputText
    };
    
    setMessages([...messages, newMsg]);
    setInputText("");
  };

  // Αν δεν βρεθεί η ταινία, επιστρέφει ένα safe UI fallback
  if (!movie) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <p>Η ταινία δεν βρέθηκε.</p>
        <button className="primary-btn" onClick={onBackToHome} style={{ marginTop: '1rem' }}>
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
            {/* Κουμπί Επιστροφής - HCI: User Control & Freedom (Nielsen Heuristics) */}
            <button 
              className="primary-btn" 
              onClick={onBackToHome}
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #444' }}
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
                <img src={movie.image} alt={`Αφίσα ${movie.title}`} className="poster-large" />
              )}
              
              <div className="details-info">
                <h1 style={{ fontSize: '2.8rem', fontWeight: 800 }}>{movie.title}</h1>
                
                {/* Meta Badges (Έτος, Διάρκεια, Rating) */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '1rem' }}>
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

                {/* Διαδραστικά Call-to-Action Κουμπιά */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button className="primary-btn" onClick={() => setIsWatchParty(true)}>
                    <Play size={18} fill="#fff" /> {isWatchParty ? "Επανεκκίνηση Ταινίας" : "Παρακολούθηση Τώρα"}
                  </button>
                  
                  {/* Κουμπί Watch Party - Ενσωμάτωση Κοινωνικού Σχεδιασμού (GreekFlix) */}
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

      {/* ΔΕΞΙ ΜΕΡΟΣ: Social Chat Sidebar (30% Διάταξη - Εμφανίζεται ΜΟΝΟ στο Watch Party) */}
      {isWatchParty && (
        <aside className="watch-sidebar" aria-label="Live Chat Δωματίου">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--accent-blue)' }} />
              <span>Watch Party Chat (3 μέλη)</span>
            </div>
          </div>

          {/* Προβολή Μηνυμάτων Χρηστών */}
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className="chat-bubble">
                <div className="chat-user">{msg.user}</div>
                <div style={{ color: '#fff' }}>{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Φόρμα Πληκτρολόγησης και Αποστολής Μηνύματος */}
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