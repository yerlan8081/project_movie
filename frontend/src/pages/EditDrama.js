"use client"

import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import { getDrama, updateDrama } from "../utils/api"
import { toast } from "react-toastify"

const allGenres = [
  "романтика",
  "драма",
  "фэнтези",
  "боевик",
  "комедия",
  "триллер",
  "фильм",
  "сериал",
]

const EditDrama = () => {
  const { id } = useParams()
  const { token } = useContext(AuthContext)
  const [drama, setDrama] = useState(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [videoUrl, setVideoUrl] = useState("")  // 新增视频URL状态
  const [genre, setGenre] = useState(allGenres[0])
  const [type, setType] = useState("serial")
  const [releaseDate, setReleaseDate] = useState("")
  const [rating, setRating] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDrama = async () => {
      try {
        console.log(`Загрузка информации о дораме с ID: ${id} для редактирования`)
        const data = await getDrama(id, token)
        console.log("Получены данные о дораме:", data)

        setDrama(data)
        setTitle(data.title || "")
        setDescription(data.description || "")
        setImage(data.image || "")
        setVideoUrl(data.videoUrl || "")  // 加载视频URL

        if (Array.isArray(data.genre) && data.genre.length > 0) {
          setGenre(data.genre[0])
        } else if (typeof data.genre === "string") {
          setGenre(data.genre)
        } else {
          setGenre(allGenres[0])
        }

        setType(data.type || "serial")

        if (data.releaseDate) {
          const date = new Date(data.releaseDate)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, "0")
          const day = String(date.getDate()).padStart(2, "0")
          setReleaseDate(`${year}-${month}-${day}`)
        } else {
          setReleaseDate("")
        }

        setRating((data.rating || 0).toString())
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Название дорамы обязательно")
      return
    }

    const updatedDrama = {
      title,
      description: description || "",
      image: image || "",
      videoUrl: videoUrl || "",  // 提交视频URL
      genre: [genre],
      type,
      releaseDate: releaseDate || new Date().toISOString().slice(0, 10),
      rating: Number.parseFloat(rating) || 0,
    }

    setSubmitting(true)

    try {
      console.log("Отправка данных для обновления дорамы:", updatedDrama)
      const result = await updateDrama(id, updatedDrama, token)
      console.log("Результат обновления:", result)

      if (result && (result._id || result.id)) {
        toast.success("Дорама успешно обновлена")
        navigate(`/dramas/${id}`)
      } else {
        toast.error("Ошибка при обновлении дорамы на сервере")
      }
    } catch (error) {
      console.error("Ошибка при обновлении дорамы:", error)
      toast.error(`Ошибка при обновлении дорамы: ${error.message}`)
    } finally {
      setSubmitting(false)
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
        <button onClick={() => navigate(-1)} className="btn">
          Назад
        </button>
      </div>
    )
  }

  return (
    <div className="edit-drama-container">
      <h1>Редактировать дораму</h1>

      <form onSubmit={handleSubmit} className="tovar-form">
        <div className="form-group">
          <label htmlFor="title">Название:</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание:</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="image">URL изображения:</label>
          <input type="text" id="image" value={image} onChange={(e) => setImage(e.target.value)} />
          {image && (
            <div className="image-preview">
              <img
                src={image || "/placeholder.svg"}
                alt="Предпросмотр"
                style={{ maxWidth: "100%", maxHeight: "200px", marginTop: "10px" }}
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = "https://via.placeholder.com/300x450?text=Ошибка+загрузки"
                }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="videoUrl">URL видео:</label>
          <input type="text" id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://example.com/video.mp4" />
        </div>

        <div className="form-group">
          <label htmlFor="genre">Жанр:</label>
          <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="type">Тип:</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="serial">Сериал</option>
            <option value="movie">Фильм</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="releaseDate">Дата выхода:</label>
          <input type="date" id="releaseDate" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="rating">Рейтинг:</label>
          <input
            type="number"
            id="rating"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            step="0.1"
            min="0"
            max="10"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Сохранение..." : "Сохранить изменения"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditDrama
