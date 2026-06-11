import React, { useEffect } from 'react'; 
import { Search, Accessibility, Trophy, Home } from 'lucide-react';

function Navbar({ onNavigate, searchQuery = '', setSearchQuery, onOpenAccessibility }) {
  
 
  useEffect(() => {
    if (!searchQuery) return;
    
    const delayDebounceFn = setTimeout(() => {
      // Εδώ η React περιμένει 500ms αφού σταματήσεις να γράφεις
      console.log("Το Debouncing λειτούργησε! Αναζήτηση για:", searchQuery);
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <nav className="navbar" aria-label="Κεντρική Πλοήγηση" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#0b0b12', borderBottom: '1px solid #222' }}>
      
      {/* Λογότυπο Εφαρμογής */}
      <div 
        className="nav-logo" 
        onClick={() => onNavigate && onNavigate('home')} 
        role="button" 
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onNavigate) {
            onNavigate('home');
          }
        }}
        style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer', color: '#fff', outline: 'none' }}
      >
        CINEVERSE
      </div>

      {/* Διαδραστικά Στοιχεία */}
      <div className="nav-actions" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        
        {/* Μπάρα Αναζήτησης */}
        <div className="search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', color: '#666' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Αναζήτηση ταινιών..."
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            aria-label="Αναζήτηση τίτλων ταινιών"
            style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
          />
        </div>

        {/* Κουμπί Αρχικής Σελίδας */}
        <button 
          className="icon-btn" 
          onClick={() => onNavigate && onNavigate('home')} 
          title="Αρχική Σελίδα"
          aria-label="Μετάβαση στην αρχική σελίδα"
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Home size={22} />
        </button>

        {/* Κουμπί Leaderboard */}
        <button 
          className="icon-btn" 
          onClick={() => onNavigate && onNavigate('championship')} 
          title="Championship Leaderboard"
          aria-label="Προβολή πίνακα κατάταξης"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Trophy size={22} style={{ color: '#ffd700' }} />
        </button>

        {/* Κουμπί Προσβασιμότητας */}
        <button 
          className="icon-btn" 
          onClick={onOpenAccessibility} 
          title="Ρυθμίσεις Προσβασιμότητας (WCAG 2.1 AA)"
          aria-label="Άνοιγμα επιλογών προσβασιμότητας"
          style={{ 
            background: 'none', 
            border: '1px solid #0071eb', 
            padding: '6px', 
            borderRadius: '50%', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 113, 235, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 113, 235, 0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 113, 235, 0.1)'}
        >
          <Accessibility size={22} style={{ color: '#0071eb' }} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;