import React, { useState, useEffect, useCallback } from 'react';
import MovieCard from './MovieCard';
import { Play, Info } from 'lucide-react';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// ✅ Προσθέσαμε το prop `currentLanguage` (π.χ. 'el-GR' ή 'en-US')
function Home({ onMovieClick, searchQuery, selectedGenre, currentLanguage = 'el-GR' }) {
  const [popularMovies, setPopularMovies] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  // ✅ Δυναμικό μήνυμα ανάλογα με τη γλώσσα αν δεν υπάρχει περιγραφή
  const formatMovies = useCallback((movies) => {
    const fallbackText = currentLanguage.startsWith('el') 
      ? 'Δεν υπάρχει διαθέσιμη περιγραφή.' 
      : 'No description available.';

    return movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview || fallbackText,
      image: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : null,
      poster: movie.poster_path ? `${POSTER_BASE_URL}${movie.poster_path}` : null,
      rating: movie.vote_average,
      releaseDate: movie.release_date
    }));
  }, [currentLanguage]); // ✅ Το formatMovies εξαρτάται πλέον από τη γλώσσα

  // Effect για Δημοφιλή & Πρόσφατα
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);

        // ✅ Αντικαταστάθηκε το hardcoded el-GR με τη μεταβλητή ${currentLanguage}
        let popularUrl = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=${currentLanguage}&page=1`;
        let recentUrl = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=${currentLanguage}&page=1`;

        if (selectedGenre && selectedGenre !== 'all') {
          popularUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}&sort_by=popularity.desc&language=${currentLanguage}&page=1`;
          recentUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}&sort_by=release_date.desc&language=${currentLanguage}&page=1`;
        }

        const [popularResponse, recentResponse] = await Promise.all([
          fetch(popularUrl),
          fetch(recentUrl)
        ]);

        const popularData = await popularResponse.json();
        const recentData = await recentResponse.json();

        const formattedPopular = formatMovies(popularData.results || []);
        const formattedRecent = formatMovies(recentData.results || []);

        setPopularMovies(formattedPopular);
        setRecentMovies(formattedRecent);
        
        if (formattedPopular.length > 0) {
          setHeroMovie(formattedPopular[0]);
        } else if (formattedRecent.length > 0) {
          setHeroMovie(formattedRecent[0]);
        } else {
          setHeroMovie(null);
        }
      } catch (error) {
        console.error("Σφάλμα κατά την ανάκτηση των ταινιών:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [API_KEY, selectedGenre, currentLanguage, formatMovies]); // ✅ Προστέθηκε το currentLanguage εδώ

  // Effect για Live Αναζήτηση
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMovies([]);
      return;
    }

    const searchMovies = async () => {
      try {
        setSearchLoading(true);
        // ✅ Δυναμική γλώσσα και στην αναζήτηση
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=${currentLanguage}`);
        const data = await response.json();
        
        setFilteredMovies(formatMovies(data.results || []));
      } catch (error) {
        console.error("Σφάλμα κατά την αναζήτηση:", error);
      } finally {
        setSearchLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      searchMovies();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, API_KEY, currentLanguage, formatMovies]); // ✅ Προστέθηκε το currentLanguage εδώ

  // Δυναμικά labels για το UI της σελίδας ανάλογα με τη γλώσσα
  const labels = {
    loading: currentLanguage.startsWith('el') ? 'Φόρτωση ταινιών...' : 'Loading movies...',
    play: currentLanguage.startsWith('el') ? 'Αναπαραγωγή' : 'Play',
    moreInfo: currentLanguage.startsWith('el') ? 'Περισσότερες Πληροφορίες' : 'More Info',
    searchResults: currentLanguage.startsWith('el') ? 'Αποτελέσματα Αναζήτησης για:' : 'Search Results for:',
    searching: currentLanguage.startsWith('el') ? 'Αναζήτηση...' : 'Searching...',
    noResults: currentLanguage.startsWith('el') ? 'Δεν βρέθηκαν ταινίες με αυτόν τον τίτλο.' : 'No movies found with this title.',
    popularTitle: selectedGenre === 'all' 
      ? (currentLanguage.startsWith('el') ? 'Δημοφιλείς Ταινίες (Most Popular)' : 'Most Popular Movies')
      : (currentLanguage.startsWith('el') ? 'Δημοφιλή σε αυτή την Κατηγορία' : 'Popular in this Category'),
    recentTitle: selectedGenre === 'all'
      ? (currentLanguage.startsWith('el') ? 'Πρόσφατες Κυκλοφορίες (Now Playing)' : 'Now Playing')
      : (currentLanguage.startsWith('el') ? 'Νέες Κυκλοφορίες Κατηγορίας' : 'New Category Releases')
  };

  if (loading) {
    return <div style={{ color: '#fff', padding: '4rem', textAlign: 'center' }}>{labels.loading}</div>;
  }

  return (
    <div>
      {/* Hero Banner */}
      {!searchQuery && heroMovie && heroMovie.image && (
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
                <Play size={18} fill="#fff" /> {labels.play}
              </button>
              <button 
                className="primary-btn" 
                onClick={() => onMovieClick(heroMovie.id)}
                style={{ backgroundColor: 'rgba(109, 109, 110, 0.7)', color: '#fff' }}
              >
                <Info size={18} /> {labels.moreInfo}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div style={{ paddingBottom: '4rem' }}>
        {searchQuery ? (
          <section className="carousel-section">
            <h2 className="section-title">{labels.searchResults} "{searchQuery}"</h2>
            {searchLoading ? (
              <p style={{ color: 'var(--text-muted)' }}>{labels.searching}</p>
            ) : filteredMovies.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1.5rem' }}>
                {filteredMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onMovieClick={onMovieClick} />
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>{labels.noResults}</p>
            )}
          </section>
        ) : (
          <>
            <section className="carousel-section">
              <h2 className="section-title">{labels.popularTitle}</h2>
              <div className="carousel-container" tabIndex={0} aria-label="Λίστα δημοφιλών ταινιών">
                {popularMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onMovieClick={onMovieClick} />
                ))}
              </div>
            </section>

            <section className="carousel-section">
              <h2 className="section-title">{labels.recentTitle}</h2>
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