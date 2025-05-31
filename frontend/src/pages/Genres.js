"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import DramaGrid from "../components/DramaGrid"
import { getDramas, getGenres } from "../utils/api"
import { toast } from "react-toastify"

const Genres = () => {
  const { genre } = useParams()
  const [dramas, setDramas] = useState([])
  const [allGenres, setAllGenres] = useState([])
  const [allDramas, setAllDramas] = useState([]) // 新增：存所有影视作品
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log("Загрузка данных для страницы жанров:", genre)

        // 加载所有分类
        const genresData = await getGenres()
        if (Array.isArray(genresData)) {
          setAllGenres(genresData)
        } else if (typeof genresData === "object") {
          setAllGenres(genresData.genres || [])
        }

        // 加载所有影视作品
        const dramasData = await getDramas()
        if (Array.isArray(dramasData)) {
          setAllDramas(dramasData)

          // 根据是否选中分类，过滤当前分类影视作品
          if (genre) {
            const filteredDramas = dramasData.filter(
              (drama) => Array.isArray(drama.genre) && drama.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
            )
            setDramas(filteredDramas)
          } else {
            setDramas(dramasData)
          }
        } else {
          setError("Неожиданный формат данных")
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных для страницы жанров:", error)
        setError(error.message)
        toast.error(`Ошибка при загрузке данных: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [genre, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  return (
    <div className="genres-page">
      {genre ? (
        <h1>Жанр: {genre}</h1>
      ) : (
        <>
          <h1>Все жанры</h1>
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Загрузка жанров...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Ошибка при загрузке жанров: {error}</p>
              <button onClick={handleRetry} className="btn">
                Попробовать снова
              </button>
            </div>
          ) : (
            <div className="genres-grid">
              {allGenres.length > 0 ? (
                allGenres.map((genreName, index) => (
                  <Link to={`/genres/${genreName}`} key={index} className="genre-card">
                    <h3>{genreName}</h3>
                  </Link>
                ))
              ) : (
                <p className="no-data">Жанры не найдены</p>
              )}
            </div>
          )}
        </>
      )}

      {/* 现有功能：显示选中分类影视作品 */}
      {genre && (
        <>
          {error ? (
            <div className="error-container">
              <p>Ошибка при загрузке дорам: {error}</p>
              <button onClick={handleRetry} className="btn">
                Попробовать снова
              </button>
            </div>
          ) : (
            <DramaGrid dramas={dramas} loading={loading} error={null} />
          )}
        </>
      )}

      {/* 新增部分：始终显示所有影视作品作为“推荐” */}
      <h2 style={{ marginTop: "40px" }}>Все фильмы и сериалы</h2>
      <DramaGrid dramas={allDramas} loading={loading} error={error} />
    </div>
  )
}

export default Genres
