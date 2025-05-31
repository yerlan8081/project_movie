"use client"

import { useState, useEffect } from "react"
import DramaGrid from "../components/DramaGrid"
import SearchBar from "../components/SearchBar"
import API_BASE_URL from "../config"

const Movies = () => {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filteredMovies, setFilteredMovies] = useState([])

  useEffect(() => {
  const fetchMovies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tovars`);

      if (!response.ok) {
        throw new Error("Не удалось загрузить фильмы");
      }

      const data = await response.json();

      if (data.success) {
        // 用type字段筛选电影
        const moviesOnly = data.data.filter(item => item.type === "movie");

        setMovies(moviesOnly);
        setFilteredMovies(moviesOnly);
      } else {
        throw new Error(data.message || "Ошибка при загрузке фильмов");
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchMovies();
}, []);


  const handleSearch = (query) => {
    if (!query.trim()) {
      setFilteredMovies(movies)
      return
    }

    const filtered = movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.description.toLowerCase().includes(query.toLowerCase()) ||
        movie.genre.some((g) => g.toLowerCase().includes(query.toLowerCase())),
    )

    setFilteredMovies(filtered)
  }

  return (
    <div className="movies-page">
      <h1>Фильмы</h1>

      <SearchBar onSearch={handleSearch} />

      <DramaGrid dramas={filteredMovies} loading={loading} error={error} />
    </div>
  )
}

export default Movies
