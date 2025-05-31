"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import Slider from "react-slick"
import DramaGrid from "../components/DramaGrid"
import SearchBar from "../components/SearchBar"
import { getDramas } from "../utils/api"
import { FaArrowRight } from "react-icons/fa"
import { toast } from "react-toastify"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"

const Home = () => {
  const [dramas, setDramas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filteredDramas, setFilteredDramas] = useState([])
  const [retryCount, setRetryCount] = useState(0)

  const navigate = useNavigate()

  const processImageUrls = (dramaList) => {
    if (!Array.isArray(dramaList)) return []

    return dramaList.map((drama) => ({
      ...drama,
      image:
        drama.image ||
        `/placeholder.svg?height=450&width=300&text=${encodeURIComponent(drama.title || "Дорама")}`,
    }))
  }

  useEffect(() => {
    const fetchDramas = async () => {
      try {
        setLoading(true)
        const data = await getDramas(null, true)

        if (Array.isArray(data)) {
          const processedData = processImageUrls(data)
          setDramas(processedData)
          setFilteredDramas(processedData)
        } else if (data && typeof data === "object") {
          const dramasArray = data.tovars || data.dramas || data.data || []
          const processedData = processImageUrls(dramasArray)
          setDramas(processedData)
          setFilteredDramas(processedData)
        } else {
          setError("Неожиданный формат данных от сервера")
        }
      } catch (error) {
        setError(error.message)
        toast.error(`Ошибка при загрузке дорам: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchDramas()
  }, [retryCount])

  const handleSearch = (query) => {
    if (!query.trim()) {
      setFilteredDramas(dramas)
      return
    }

    const filtered = dramas.filter(
      (drama) =>
        drama.title.toLowerCase().includes(query.toLowerCase()) ||
        (drama.description && drama.description.toLowerCase().includes(query.toLowerCase())) ||
        (drama.genre &&
          Array.isArray(drama.genre) &&
          drama.genre.some((g) => g.toLowerCase().includes(query.toLowerCase()))),
    )

    setFilteredDramas(filtered)
  }

  const allGenres = [
    ...new Set(
      dramas.flatMap((drama) => (drama.genre && Array.isArray(drama.genre) ? drama.genre : [])),
    ),
  ].slice(0, 6)

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 5000,
    slidesToShow: 5,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: false,
    arrows: false,
    swipe: false,
    draggable: false,
    afterChange: () => {
      navigate("/") // 切换后跳转首页
    },
  }

  return (
    <div className="home-page">
      <div className="hero-slider" style={{ marginBottom: "30px", padding: "0 40px" }}>
        <Slider {...sliderSettings}>
          {dramas.map((drama) => (
            <div key={drama.id || drama._id} style={{ cursor: "default", padding: "0 10px" }}>
              <img
                src={drama.image}
                alt={drama.title}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  height: "400px",
                  objectFit: "cover",
                }}
              />
            </div>
          ))}
        </Slider>
      </div>

      <SearchBar onSearch={handleSearch} />

      {/* <div className="debug-info">
        <p>Загружено дорам: {dramas.length}</p>
        <p>Отфильтровано: {filteredDramas.length}</p>
        <p>Состояние: {loading ? "Загрузка..." : error ? `Ошибка: ${error}` : "Готово"}</p>
      </div> */}

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Все дорамы</h2>
        </div>

        {error ? (
          <div className="error-container">
            <p>Ошибка при загрузке дорам: {error}</p>
            <button onClick={handleRetry} className="btn">
              Попробовать снова
            </button>
          </div>
        ) : (
          <DramaGrid dramas={filteredDramas} loading={loading} error={null} />
        )}
      </section>

      {allGenres.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Популярные жанры</h2>
          </div>
          <div className="genres-grid">
            {allGenres.map((genre) => (
              <Link to={`/genres/${genre}`} key={genre} className="genre-card">
                <h3>{genre}</h3>
              </Link>
            ))}
            <Link to="/genres" className="genre-card see-all">
              <h3>
                Все жанры <FaArrowRight />
              </h3>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home
