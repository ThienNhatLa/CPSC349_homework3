import { useEffect, useMemo, useState } from "react";
import "./Movie.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w342";
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

export default function Movie() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!API_KEY) {
      setError("Missing REACT_APP_TMDB_API_KEY. Add it to a .env file and restart npm start.");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        let url;
        if (query.trim().length > 0) {
          url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
            query
          )}&page=${page}&include_adult=false`;
        } else {
          url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&page=${page}&include_adult=false`;
          
          if (sort) {
            url += `&sort_by=${sort}`;
          }
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
        const data = await res.json();

        if (!cancelled) {
          setMovies(Array.isArray(data.results) ? data.results : []);
          setTotalPages(data.total_pages || 0);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, query, sort]);

  const sortedMovies = useMemo(() => {
    if (!query || !sort) return movies;

    const copy = [...movies];

    const dateVal = (m) => {
      const t = m.release_date ? new Date(m.release_date).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };
    const ratingVal = (m) => (typeof m.vote_average === "number" ? m.vote_average : 0);

    switch (sort) {
      case "release_date.asc":
        copy.sort((a, b) => dateVal(a) - dateVal(b));
        break;
      case "release_date.desc":
        copy.sort((a, b) => dateVal(b) - dateVal(a));
        break;
      case "vote_average.asc":
        copy.sort((a, b) => ratingVal(a) - ratingVal(b));
        break;
      case "vote_average.desc":
        copy.sort((a, b) => ratingVal(b) - ratingVal(a));
        break;
      default:
        break;
    }

    return copy;
  }, [movies, sort, query]);

  function handleSearchInputChange(e) {
    const value = e.target.value;
    setSearchInput(value);
    
    if (value.trim() === "") {
      setQuery("");
      setPage(1);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      setPage(1);
      setQuery(searchInput.trim());
    }
  }

  return (
    <>
      <header>
        <h1>Movie Explorer</h1>
        <div className="controls">
          <input
            type="text"
            id="searchInput"
            placeholder="Search for a movie..."
            value={searchInput}
            onChange={handleSearchInputChange}
            onKeyPress={handleKeyPress}
          />
          <select
            id="sortSelect"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="">Sort By</option>
            <option value="release_date.asc">Release Date (Asc)</option>
            <option value="release_date.desc">Release Date (Desc)</option>
            <option value="vote_average.asc">Rating (Asc)</option>
            <option value="vote_average.desc">Rating (Desc)</option>
          </select>
        </div>
      </header>

      <div className="container">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="loading" style={{ color: '#d32f2f' }}>Error: {error}</div>}
        
        {!loading && !error && (
          <>
            <div id="moviesContainer" className="movies-grid">
              {sortedMovies.length === 0 ? (
                <div className="no-results">No movies found.</div>
              ) : (
                sortedMovies.map((movie) => (
                  <div className="movie-card" key={movie.id}>
                    <img
                      className="movie-poster"
                      src={
                        movie.poster_path
                          ? `${IMG_BASE}${movie.poster_path}`
                          : "https://via.placeholder.com/342x513?text=No+Poster"
                      }
                      alt={movie.title || "Movie poster"}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/342x513?text=No+Poster";
                      }}
                    />
                    <div className="movie-info">
                      <div className="movie-title">{movie.title || "Untitled"}</div>
                      <div className="movie-details">
                        Release Date: {movie.release_date || "Unknown"}
                      </div>
                      <div className="movie-details">
                        Rating: {typeof movie.vote_average === "number" 
                          ? movie.vote_average 
                          : "0"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pagination">
              <button
                id="prevBtn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </button>
              <span className="page-info" id="pageInfo">
                Page {page} {totalPages > 0 ? `of ${totalPages}` : ''}
              </span>
              <button
                id="nextBtn"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || (totalPages > 0 && page >= totalPages)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}