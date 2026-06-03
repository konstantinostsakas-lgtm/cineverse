import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { Play, Info } from 'lucide-react';

function Home({ onMovieClick, searchQuery }) {
  // States για την αποθήκευση των ταινιών από το API
  const [popularMovies, setPopularMovies] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // Παίρνουμε το API Key από το αρχείο .env.local με ασφάλεια
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

  useEffect(() => {
    // Συνάρτηση για το τράβηγμα των δεδομένων
    const fetchMovies = async () => {
      try {
        setLoading(true);

        // 1. Fetch Δημοφιλείς Ταινίες (Popular)
        const popularResponse = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=el-GR&page=1`);
        const popularData = await popularResponse.json();

        // 2. Fetch Πρόσφατες/Τώρα στους κινηματογράφους (Now Playing αντί για recent)
        const recentResponse = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=el-GR&page=1`);
        const recentData = await recentResponse.json();

        // Μετατρέπουμε τα δεδομένα ώστε να ταιριάζουν με τη δομή που ήδη έχεις
        const formatMovies = (movies) => movies.map(movie => ({
          id: movie.id,
          title: movie.title,
          overview: movie.overview || 'Δεν υπάρχει διαθέσιμη περιγραφή στα Ελληνικά.',
          image: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : 'https://via.placeholder.com/1920x1080?text=No+Image',
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
          rating: movie.vote_average,
          releaseDate: movie.release_date
        }));

        const formattedPopular = formatMovies(popularData.results || []);
        const formattedRecent = formatMovies(recentData.results || []);

        setPopularMovies(formattedPopular);
        setRecentMovies(formattedRecent);
        
        // Επιλέγουμε την πρώτη δημοφιλή ταινία για το μεγάλο Hero Banner
        if (formattedPopular.length > 0) {
          setHeroMovie(formattedPopular[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Σφάλμα κατά την ανάκτηση των ταινιών:", error);
        setLoading(false);
      }
    };

    fetchMovies();
  }, [API_KEY]);

  // Λειτουργία Αναζήτησης (Search) μέσω του API (αν ο χρήστης γράφει κάτι)
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMovies([]);
      return;
    }

    const searchMovies = async () => {
      try {
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=el-GR`);
        const data = await response.json();
        
        const formattedSearch = (data.results || []).map(movie => ({
          id: movie.id,
          title: movie.title,
          overview: movie.overview || 'Δεν υπάρχει διαθέσιμη περιγραφή.',
          image: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : 'https://via.placeholder.com/1920x1080?text=No+Image',
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
          rating: movie.vote_average,
          releaseDate: movie.release_date
        }));

        setFilteredMovies(formattedSearch);
      } catch (error) {
        console.error("Σφάλμα κατά την αναζήτηση:", error);
      }
    };

    // Μικρή καθυστέρηση (Debounce) για να μην χτυπάει το API σε κάθε γράμμα αμέσως
    const delayDebounce = setTimeout(() => {
      searchMovies();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, API_KEY]);

  // Αν ακόμα φορτώνουν τα δεδομένα, δείξε ένα απλό μήνυμα
  if (loading) {
    return <div style={{ color: '#fff', padding: '4rem', textAlign: 'center' }}>Φόρτωση ταινιών...</div>;
  }

  return (
    <div>
      {/* Hero Banner (Μόνο αν υπάρχει heroMovie και δεν γίνεται αναζήτηση) */}
      {!searchQuery && heroMovie && (
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
          /* 1ο Σενάριο: Αναζήτηση */
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
          /* 2ο Σενάριο: Default Αρχική Σελίδα με ζωντανά Carousels */
          <>
            <section className="carousel-section">
              <h2 className="section-title">Δημοφιλείς Ταινίες (Most Popular)</h2>
              <div className="carousel-container" tabIndex={0} aria-label="Λίστα δημοφιλών ταινιών">
                {popularMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onMovieClick={onMovieClick} />
                ))}
              </div>
            </section>

            <section className="carousel-section">
              <h2 className="section-title">Πρόσφατες Κυκλοφορίες (Now Playing)</h2>
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