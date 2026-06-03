import React from 'react';
import { Search, ShieldAlert, Trophy, Home } from 'lucide-react'; // Εισαγωγή σύγχρονων εικονιδίων για οπτικό feedback

function Navbar({ onNavigate, searchQuery, setSearchQuery, onOpenAccessibility }) {
  return (
    <nav className="navbar" aria-label="Κεντρική Πλοήγηση">
      {/* Λογότυπο Εφαρμογής - HCI: 📸 Οπτική Αναγνωρισιμότητα & Shortcut για την Αρχική */}
      <div className="nav-logo" onClick={() => onNavigate('home')} role="button" tabIndex={0}>
        CINEVERSE
      </div>

      {/* Διαδραστικά Στοιχεία: Αναζήτηση και Μενού */}
      <div className="nav-actions">
        {/* Μπάρα Αναζήτησης - Σενάριο Εργασίας */}
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Αναζήτηση ταινιών..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Αναζήτηση τίτλων ταινιών"
          />
        </div>

        {/* Κουμπί Αρχικής Σελίδας */}
        <button 
          className="icon-btn" 
          onClick={() => onNavigate('home')} 
          title="Αρχική Σελίδα"
          aria-label="Μετάβαση στην αρχική σελίδα"
        >
          <Home size={22} />
        </button>

        {/* Κουμπί Leaderboard - Ενσωμάτωση Gamification από GreekFlix */}
        <button 
          className="icon-btn" 
          onClick={() => onNavigate('leaderboard')} 
          title="Championship Leaderboard"
          aria-label="Προβολή πίνακα κατάταξης"
        >
          <Trophy size={22} style={{ color: '#ffd700' }} /> {/* Χρυσό χρώμα για το trophy feedback */}
        </button>

        {/* Κουμπί Προσβασιμότητας - Ενσωμάτωση Inclusive Design από GreekFlix */}
        <button 
          className="icon-btn" 
          onClick={onOpenAccessibility} 
          title="Ρυθμίσεις Προσβασιμότητας (WCAG 2.1 AA)"
          aria-label="Άνοιγμα επιλογών προσβασιμότητας"
          style={{ border: '1px solid #444', padding: '6px' }}
        >
          <ShieldAlert size={22} style={{ color: '#0071eb' }} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;