import React from 'react';
import { moviesData } from '../data/movies';
import MovieCard from './MovieCard';
import { Play, Info } from 'lucide-react'; // Εικονίδια για τα CTA buttons του Hero Banner

function Home({ onMovieClick, searchQuery }) {
  
  // Φιλτράρισμα των ταινιών με βάση την κατηγορία τους για τα Carousels
  const popularMovies = moviesData.filter(movie => movie.category === 'popular');
  const recentMovies = moviesData.filter(movie => movie.category === 'recent');

  // Καθολικό φιλτράρισμα για τη λειτουργία της Αναζήτησης (Search)
  const filteredMovies = moviesData.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Επιλογή της πρώτης ταινίας (The Batman) ως Hero Banner της πλατφόρμας
  const heroMovie = moviesData[0];

  return (
    <div>
      {/* Εμφάνιση του Hero Banner ΜΟΝΟ όταν δεν γίνεται αναζήτηση (HCI: Μείωση οπτικού θορύβου) */}
      {!searchQuery && (
        <section 
          className="hero" 
          style={{ backgroundImage: `url(${heroMovie.image})` }}
          aria-label="Προτεινόμενη Ταινία"
        >
          <div className="hero-content">
            <h1 className="hero-title">{heroMovie.title}</h1>
            <p className="hero-overview">{heroMovie.overview}</p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="primary-btn" onClick={() => onMovieClick(heroMovie.id)}>
                <Play size={18} fill="#fff" /> Αναπαραγωγή
              </button>
              <button 
                className="primary-btn" 
                onClick={() => onMovieClick(heroMovie.id)}
                style={{ backgroundColor: 'rgba(109, 109, 110, 0.7)', color: '#fff' }}
              >
                <Info size={18} /> Περισσότερες Πληροφορίες
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Κύριο μέρος εμφανίσεων των λιστών ταινιών */}
      <div style={{ paddingBottom: '4rem' }}>
        {searchQuery ? (
          /* 1ο Σενάριο: Ο χρήστης αναζητά ταινία - Εμφάνιση Grid Αποτελεσμάτων */
          <section className="carousel-section">
            <h2 className="section-title">Αποτελέσματα Αναζήτησης για: "{searchQuery}"</h2>
            {filteredMovies.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1.5rem' }}>
                {filteredMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onMovieClick={onMovieClick} />
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Δεν βρέθηκαν ταινίες με αυτόν τον τίτλο.</p>
            )}
          </section>
        ) : (
          /* 2ο Σενάριο: Κανονική προβολή (Default Home Screen) - Σενάριο Εργασίας */
          <>
            {/* Οριζόντιο Carousel: Δημοφιλείς Ταινίες */}
            <section className="carousel-section">
              <h2 className="section-title">Δημοφιλείς Ταινίες (Most Popular)</h2>
              <div className="carousel-container" tabIndex={0} aria-label="Λίστα δημοφιλών ταινιών">
                {popularMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onMovieClick={onMovieClick} />
                ))}
              </div>
            </section>

            {/* Οριζόντιο Carousel: Πρόσφατες Κυκλοφορίες */}
            <section className="carousel-section">
              <h2 className="section-title">Πρόσφατες Κυκλοφορίες (Most Recent)</h2>
              <div className="carousel-container" tabIndex={0} aria-label="Λίστα πρόσφατων κυκλοφοριών">
                {recentMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onMovieClick={onMovieClick} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;