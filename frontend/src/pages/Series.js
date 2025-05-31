"use client"

import { useState, useEffect } from "react"
import DramaGrid from "../components/DramaGrid"
import SearchBar from "../components/SearchBar"
import API_BASE_URL from "../config"

const Series = () => {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filteredSeries, setFilteredSeries] = useState([])

  useEffect(() => {
  const fetchSeries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tovars`)

      if (!response.ok) {
        throw new Error("Не удалось загрузить сериалы")
      }

      const data = await response.json()

      if (data.success) {
        // 用type字段筛选电视剧
        const seriesOnly = data.data.filter(item => item.type === "serial")

        setSeries(seriesOnly)
        setFilteredSeries(seriesOnly)
      } else {
        throw new Error(data.message || "Ошибка при загрузке сериалов")
      }
    } catch (error) {
      console.error("Error fetching series:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  fetchSeries()
}, [])


  const handleSearch = (query) => {
    if (!query.trim()) {
      setFilteredSeries(series)
      return
    }

    const filtered = series.filter(
      (serie) =>
        serie.title.toLowerCase().includes(query.toLowerCase()) ||
        serie.description.toLowerCase().includes(query.toLowerCase()) ||
        serie.genre.some((g) => g.toLowerCase().includes(query.toLowerCase())),
    )

    setFilteredSeries(filtered)
  }

  return (
    <div className="series-page">
      <h1>Сериалы</h1>

      <SearchBar onSearch={handleSearch} />

      <DramaGrid dramas={filteredSeries} loading={loading} error={error} />
    </div>
  )
}

export default Series
