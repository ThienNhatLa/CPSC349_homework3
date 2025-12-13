
import { useEffect, useMemo, useState } from "react";
import "./Movie.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w342";
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

export default function Movie() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState(""); // actual submitted query

  const [sort, setSort] = useState("release_desc"); // release_desc, release_asc, rating_desc, rating_asc
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

        const base =
          query.trim().length > 0
            ? `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
                query
              )}&page=${page}&include_adult=false`
            : `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&page=${page}&include_adult=false`;

        const res = await fetch(base);
        if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
        const data = await res.json();

        if (!cancelled) {
          setMovies(Array.isArray(data.results) ? data.results : []);
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
  }, [page, query]);

  const sortedMovies = useMemo(() => {
    const copy = [...movies];

    const dateVal = (m) => {
      const t = m.release_date ? new Date(m.release_date).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };
    const ratingVal = (m) => (typeof m.vote_average === "number" ? m.vote_average : 0);

    switch (sort) {
      case "release_asc":
        copy.sort((a, b) => dateVal(a) - dateVal(b));
        break;
      case "release_desc":
        copy.sort((a, b) => dateVal(b) - dateVal(a));
        break;
      case "rating_asc":
        copy.sort((a, b) => ratingVal(a) - ratingVal(b));
        break;
      case "rating_desc":
        copy.sort((a, b) => ratingVal(b) - ratingVal(a));
        break;
      default:
        break;
    }

    return copy;
  }, [movies, sort]);

  function handleSubmit(e) {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  function handleClear() {
    setSearchInput("");
    setQuery("");
    setPage(1);
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">🎬</div>
          <div>
            <h1>Movie Explorer</h1>
            <p>20 movies/page • Search • Sort • Pagination</p>
          </div>
        </div>

        <form className="search" onSubmit={handleSubmit}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search movies by title..."
          />
          <button type="submit">Search</button>
          <button type="button" className="secondary" onClick={handleClear}>
            Clear
          </button>
        </form>

        <div className="controls">
          <label>
            Sort:
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="release_desc">Release date (new → old)</option>
              <option value="release_asc">Release date (old → new)</option>
              <option value="rating_desc">Average rating (high → low)</option>
              <option value="rating_asc">Average rating (low → high)</option>
            </select>
          </label>
        </div>
      </header>

      <main className="content">
        <div className="statusRow">
          <div className="modeTag">
            {query ? (
              <span>
                Search results for: <strong>{query}</strong>
              </span>
            ) : (
              <span>Discover movies</span>
            )}
          </div>

          {loading ? <div className="muted">Loading…</div> : null}
          {error ? <div className="error">Error: {error}</div> : null}
        </div>

        <section className="grid">
          {!loading && !error && sortedMovies.length === 0 ? (
            <div className="empty">No movies found.</div>
          ) : (
            sortedMovies.map((m) => (
              <article className="card" key={m.id}>
                <div className="posterWrap">
                  <img
                    className="poster"
                    src={m.poster_path ? `${IMG_BASE}${m.poster_path}` : ""}
                    alt={m.title || "Movie poster"}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/342x513?text=No+Poster";
                    }}
                  />
                </div>

                <div className="meta">
                  <h2 className="title" title={m.title}>
                    {m.title || "Untitled"}
                  </h2>

                  <div className="sub">
                    <span className="pill">📅 {m.release_date || "Unknown"}</span>
                    <span className="pill">
                      ⭐ {typeof m.vote_average === "number" ? m.vote_average.toFixed(1) : "0.0"}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <footer className="pager">
          <button
            className="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </button>

          <div className="pageNum">Page {page}</div>

          <button onClick={() => setPage((p) => p + 1)} disabled={loading}>
            Next
          </button>
        </footer>
      </main>
    </div>
  );
}
