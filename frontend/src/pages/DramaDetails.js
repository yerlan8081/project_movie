"use client"

import { useState, useEffect, useContext } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { FaStar, FaCalendarAlt, FaEdit, FaTrash, FaHeart, FaRegHeart } from "react-icons/fa"
import { getDrama, deleteDrama } from "../utils/api"
import { AuthContext } from "../contexts/AuthContext"
import { FavoritesContext } from "../contexts/FavoritesContext"
import CommentSection from "../components/CommentSection"
import { toast } from "react-toastify"
import ReactPlayer from "react-player" // 需要先安装 react-player: npm install react-player

const DramaDetails = () => {
  const { id } = useParams()
  const { user, token } = useContext(AuthContext)
  const { addToFavorites, removeFromFavorites, isFavorite } = useContext(FavoritesContext)
  const [drama, setDrama] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const isAdmin = user && user.role === "admin"
  const favorited = drama ? isFavorite(drama._id || drama.id) : false

  useEffect(() => {
    const fetchDrama = async () => {
      try {
        console.log(`Загрузка информации о дораме с ID: ${id}`)
        const data = await getDrama(id, token)
        console.log("Получены данные о дораме:", data)

        // Нормализуем данные дорамы
        const normalizedDrama = {
          _id: data._id || data.id || id,
          id: data._id || data.id || id,
          title: data.title || "Без названия",
          description: data.description || "",
          image: data.image || "",
          genre: Array.isArray(data.genre) ? data.genre : typeof data.genre === "string" ? [data.genre] : [],
          releaseDate: data.releaseDate || new Date().toISOString(),
          rating: data.rating || 0,
          videoUrl: data.videoUrl || "", // 新增视频链接字段，需后端提供
        }

        setDrama(normalizedDrama)
      } catch (error) {
        console.error("Ошибка при загрузке дорамы:", error)
        setError(error.message)
        toast.error(`Ошибка при загрузке дорамы: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchDrama()
  }, [id, token])

  const handleDelete = async () => {
    if (!isAdmin) return

    if (!window.confirm("Вы уверены, что хотите удалить эту дораму?")) {
      return
    }

    try {
      await deleteDrama(id, token)
      toast.success("Дорама успешно удалена")
      navigate("/")
    } catch (error) {
      console.error("Ошибка при удалении дорамы:", error)
      toast.error(`Ошибка при удалении дорамы: ${error.message}`)
    }
  }

  const handleFavoriteToggle = () => {
    if (!user) {
      toast.error("Войдите, чтобы добавить в избранное")
      return
    }

    if (favorited) {
      removeFromFavorites(drama._id || drama.id)
      toast.success("Удалено из избранного")
    } else {
      addToFavorites(drama)
      toast.success("Добавлено в избранное")
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка информации о дораме...</p>
      </div>
    )
  }

  if (error || !drama) {
    return (
      <div className="error-container">
        <p>Ошибка: {error || "Дорама не найдена"}</p>
        <Link to="/" className="btn">
          Вернуться на главную
        </Link>
      </div>
    )
  }

  return (
    <div className="drama-details">
      <div className="drama-header">
        <div className="drama-poster">
          <img
            src={drama.image || "/placeholder.svg"}
            alt={drama.title}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "https://via.placeholder.com/300x450?text=Нет+изображения"
            }}
          />
          <button
            className="favorite-button-large"
            onClick={handleFavoriteToggle}
            aria-label={favorited ? "Удалить из избранного" : "Добавить в избранное"}
          >
            {favorited ? <FaHeart className="heart-icon filled" /> : <FaRegHeart className="heart-icon" />}
            <span>{favorited ? "В избранном" : "В избранное"}</span>
          </button>
        </div>

        <div className="drama-info-container">
          <h1 className="drama-title">{drama.title}</h1>

          <div className="drama-meta">
            <div className="meta-item">
              <FaStar className="meta-icon" />
              <span>{drama.rating ? drama.rating.toFixed(1) : "0.0"}</span>
            </div>
            <div className="meta-item">
              <FaCalendarAlt className="meta-icon" />
              <span>{drama.releaseDate ? new Date(drama.releaseDate).toLocaleDateString() : "Дата не указана"}</span>
            </div>
          </div>

          <div className="drama-genres">
            {(drama.genre || []).map((genre, index) => (
              <Link to={`/genres/${genre}`} key={index} className="genre-tag">
                {genre}
              </Link>
            ))}
          </div>

          {/* 视频播放器部分 */}
          {drama.videoUrl && (
            <div className="video-player-container" style={{ marginTop: "20px" }}>
              <ReactPlayer
                url={drama.videoUrl}
                controls
                width="100%"
                height="480px"
              />
            </div>
          )}

          <div className="drama-description">
            <h2>Описание</h2>
            {drama.description ? <p>{drama.description}</p> : <p>Описание отсутствует</p>}
          </div>

          {isAdmin && (
            <div className="admin-actions">
              <Link to={`/admin/edit/${drama._id || drama.id}`} className="edit-btn">
                <FaEdit /> Редактировать
              </Link>
              <button onClick={handleDelete} className="delete-btn">
                <FaTrash /> Удалить
              </button>
            </div>
          )}
        </div>
      </div>

      <CommentSection dramaId={drama._id || drama.id} />
    </div>
  )
}

export default DramaDetails
