import React from 'react';
import { Star } from 'lucide-react';

// ΔΙΟΡΘΩΣΗ: Δεχόμαστε και το onSelectMovie ΚΑΙ το onMovieClick για να μην κρασάρει ποτέ, ό,τι κι αν στείλει το App.js!
function MovieCard({ movie, onSelectMovie, onMovieClick }) {
  // Επιλογή της σωστής συνάρτησης click ανάλογα με το τι πέρασε το App.js
  const handleCardClick = onSelectMovie || onMovieClick;

  // TMDB Base URL για τις εικόνες των πόστερ
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  // ΔΙΟΡΘΩΣΗ: Υποστηρίζουμε και το movie.releaseDate αλλά και το movie.release_date του API
  const rawDate = movie.release_date || movie.releaseDate;
  const releaseYear = rawDate ? rawDate.split('-')[0] : 'N/A';

  // ΔΙΟΡΘΩΣΗ: Υποστηρίζουμε και το έτοιμο movie.poster αλλά και το movie.poster_path από το API
  const moviePoster = movie.poster || (movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster');

  // ΔΙΟΡΘΩΣΗ: Υποστηρίζουμε movie.vote_average (από API) και movie.rating
  const rawRating = movie.vote_average !== undefined ? movie.vote_average : movie.rating;
  const formattedRating = typeof rawRating === 'number' ? rawRating.toFixed(1) : '0.0';

  return (
    <div 
      className="movie-card" 
      onClick={() => handleCardClick && handleCardClick(movie.id)}
      role="button"
      tabIndex={0}
      aria-label={`Προβολή λεπτομερειών για την ταινία ${movie.title}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && handleCardClick) {
          handleCardClick(movie.id);
        }
      }}
    >
      <img 
        src={moviePoster} 
        alt={`Αφίσα της ταινίας ${movie.title}`} 
        className="card-img" 
        loading="lazy"
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} // fallback styling
      />
      
      <div className="card-info" style={{ marginTop: '10px' }}>
        <h3 className="card-title" title={movie.title} style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {movie.title}
        </h3>
        
        <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#aaa', fontSize: '0.9rem' }}>
          <span>{releaseYear}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} fill="#ffd700" color="#ffd700" aria-hidden="true" />
            <span className="rating-badge" style={{ color: '#fff', fontWeight: 'bold' }}>{formattedRating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;