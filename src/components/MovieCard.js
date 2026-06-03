import React from 'react';
import { Star } from 'lucide-react'; // Εικονίδιο αστεριού για τη βαθμολογία

function MovieCard({ movie, onMovieClick }) {
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
      {/* Εικόνα/Poster Ταινίας - HCI: Βασικό σημείο αλληλεπίδρασης για το σενάριο της εργασίας */}
      <img 
        src={movie.image} 
        alt={`Αφίσα της ταινίας ${movie.title}`} 
        className="card-img" 
        loading="lazy"
      />
      
      {/* Πληροφορίες Ταινίας (Κάτω μέρος κάρτας) */}
      <div className="card-info">
        <h3 className="card-title" title={movie.title}>
          {movie.title}
        </h3>
        
        <div className="card-meta">
          <span>{movie.year}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} fill="#ffd700" color="#ffd700" aria-hidden="true" />
            <span className="rating-badge">{movie.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;