import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import MovieDetails from './components/MovieDetails';
import Leaderboard from './components/Leaderboard';
import AccessibilityModal from './components/AccessibilityModal';

function App() {
  // Navigation State: 'home', 'details', 'leaderboard'
  const [currentPage, setCurrentPage] = useState('home');
  // Επιλεγμένη ταινία για τη σελίδα λεπτομερειών
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  // State για την μπάρα αναζήτησης
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accessibility States (Από το GreekFlix)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [contrastMode, setContrastMode] = useState('normal'); // 'normal' ή 'high-contrast'
  const [colorBlindness, setColorBlindness] = useState('none'); // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
  const [fontSize, setFontSize] = useState(1); // 1 = 100%, 1.2 = 120%, 1.4 = 140%

  // Δυναμική εφαρμογή των ρυθμίσεων προσβασιμότητας στο root element του εγγράφου
  useEffect(() => {
    const root = document.documentElement;
    
    // Εφαρμογή High Contrast class
    if (contrastMode === 'high-contrast') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Καθαρισμός και εφαρμογή φίλτρων αχρωματοψίας
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (colorBlindness !== 'none') {
      root.classList.add(colorBlindness);
    }

    // Εφαρμογή Text Scaling
    root.style.setProperty('--font-scale', fontSize.toString());
    root.style.fontSize = `${fontSize * 16}px`; // HCI: Δυναμική προσαρμογή μεγέθους για inclusive σχεδιασμό

  }, [contrastMode, colorBlindness, fontSize]);

  // Συνάρτηση για πλοήγηση στη σελίδα λεπτομερειών μιας ταινίας
  const handleNavigateToMovie = (id) => {
    setSelectedMovieId(id);
    setCurrentPage('details');
    window.scrollTo(0, 0);
  };

  // Render σελίδων ανάλογα με το currentPage State (Conditional Rendering)
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onMovieClick={handleNavigateToMovie} searchQuery={searchQuery} />;
      case 'details':
        return <MovieDetails movieId={selectedMovieId} onBackToHome={() => setCurrentPage('home')} />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <Home onMovieClick={handleNavigateToMovie} searchQuery={searchQuery} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* SVG Φίλτρα για την αλλαγή χρωματικών καναλιών (Color Blindness Simulation SVG Filters) */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
          </filter>
        </defs>
      </svg>

      {/* Κοινή Γραμμή Πλοήγησης */}
      <Navbar 
        onNavigate={(page) => { setCurrentPage(page); setSearchQuery(''); }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
      />

      {/* Κύριο Περιεχόμενο Εφαρμογής */}
      <div className="main-content">
        {renderPage()}
      </div>

      {/* Accessibility Preferences Modal (WCAG 2.1 AA Compliance) */}
      {isAccessibilityOpen && (
        <AccessibilityModal 
          onClose={() => setIsAccessibilityOpen(false)}
          contrastMode={contrastMode}
          setContrastMode={setContrastMode}
          colorBlindness={colorBlindness}
          setColorBlindness={setColorBlindness}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      )}
    </div>
  );
}

export default App;