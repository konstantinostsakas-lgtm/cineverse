import React from 'react';
import { Star } from 'lucide-react';

function MovieCard({ movie, onMovieClick }) {
  // Παίρνουμε μόνο το έτος από το releaseDate (π.χ. από "2024-03-15" κρατάμε το "2024")
  const releaseYear = movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A';

  // Στρογγυλοποίηση της βαθμολογίας σε ένα δεκαδικό (π.χ. 7.842 -> 7.8)
  const formattedRating = movie.rating ? movie.rating.toFixed(1) : '0.0';

  return (
    <div 
      className="movie-card" 
      onClick={() => onMovieClick(movie.id)}
      role="button"
      tabIndex={0}
      aria-label={`Προβολή λεπτομερειών για την ταινία ${movie.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onMovieClick(movie.id);
        }
      }}
    >
      {/* Χρησιμοποιούμε το movie.poster για σωστή αναλογία κάθετης κάρτας (Portrait) */}
      <img 
        src={movie.poster} 
        alt={`Αφίσα της ταινίας ${movie.title}`} 
        className="card-img" 
        loading="lazy"
      />
      
      <div className="card-info">
        <h3 className="card-title" title={movie.title}>
          {movie.title}
        </h3>
        
        <div className="card-meta">
          {/* Εμφάνιση μόνο του έτους κυκλοφορίας */}
          <span>{releaseYear}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} fill="#ffd700" color="#ffd700" aria-hidden="true" />
            <span className="rating-badge">{formattedRating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;