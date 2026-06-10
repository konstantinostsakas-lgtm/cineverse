import React from 'react';
import { Star } from 'lucide-react';

function MovieCard({ movie, onSelectMovie, onMovieClick }) {
  // Επιλογή της σωστής συνάρτησης click ανάλογα με το τι πέρασε το App.js
  const handleCardClick = onSelectMovie || onMovieClick;

  // TMDB Base URL για τις εικόνες των πόστερ
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  // Υποστήριξη movie.releaseDate αλλά και movie.release_date του API
  const rawDate = movie.release_date || movie.releaseDate;
  const releaseYear = rawDate ? rawDate.split('-')[0] : 'N/A';

  // ΑΦΑΙΡΕΣΗ MOCK: Μόνο πραγματικά paths εικόνων από το TMDB API, χωρίς placeholders
  const moviePoster = movie.poster || (movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null);

  // Υποστήριξη movie.vote_average (από API) και movie.rating
  const rawRating = movie.vote_average !== undefined ? movie.vote_average : movie.rating;
  const formattedRating = typeof rawRating === 'number' ? rawRating.toFixed(1) : '0.0';

  // Έλεγχος για Premium status και συμμετοχή στον διαγωνισμό (με fallback για λόγους δοκιμής)
  const isPremium = movie.isPremium || movie.premium || movie.id % 5 === 0;
  const isContest = movie.isContest || movie.contest || movie.id % 3 === 0;

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
      {/* Container για την εικόνα και τα απόλυτα τοποθετημένα badges */}
      <div style={{ position: 'relative', width: '100%' }}>
        
        {/* PREMIUM BADGE */}
        {isPremium && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#ffd700', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.4)', letterSpacing: '0.5px' }}>
            PREMIUM
          </div>
        )}

        {/* CONTEST REWARDS BADGE */}
        {isContest && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#e50914', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.4)', letterSpacing: '0.5px' }}>
            🏆 REWARDS
          </div>
        )}

        {/* Εμφάνιση της εικόνας μόνο αν υπάρχει πραγματικό asset */}
        {moviePoster ? (
          <img 
            src={moviePoster} 
            alt={`Αφίσα της ταινίας ${movie.title}`} 
            className="card-img" 
            loading="lazy"
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
          />
        ) : (
          /* Real-time Fallback UI αντί για mock εικόνα */
          <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: '#1a1a24', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#666', border: '1px solid #222' }}>
            🎬 {movie.title}
          </div>
        )}
      </div>
      
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

        {/* Επεξηγηματικό μήνυμα συνεισφοράς πόντων στο Contest */}
        {isContest && (
          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#ffd700', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid #222', paddingTop: '6px' }}>
            <span>+XP Πόντοι για τον Διαγωνισμό</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieCard;