// src/contexts/FavoritesContext.jsx

"use client"

import { createContext, useState, useEffect, useContext } from "react"
import { AuthContext } from "./AuthContext"

export const FavoritesContext = createContext()

export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext)
  const [favorites, setFavorites] = useState([])

  // 1️⃣ 监听 “登录状态 / 用户” 变化：如果已登录，则尝试从 localStorage 读取该用户的 favorites；
  //    如果未登录，则清空内存中的 favorites。
  useEffect(() => {
    if (isAuthenticated && user) {
      const userId = user.userId || "default"
      const storageKey = `favorites_${userId}`

      try {
        const stored = window.localStorage.getItem(storageKey)
        if (stored) {
          setFavorites(JSON.parse(stored))
        } else {
          // 如果 localStorage 里没有，初始化为空数组
          setFavorites([])
        }
      } catch (err) {
        console.error("读取 localStorage 中的 favorites 失败:", err)
        setFavorites([])
      }
    } else {
      // 用户未登录：清空内存中的收藏（但并不删除 localStorage；下次同一用户登录可恢复）
      setFavorites([])
    }
  }, [isAuthenticated, user])

  // 2️⃣ 监听 “favorites / 登录状态 / 用户” 变化：如果已登录，则把最新的 favorites 写回 localStorage。
  //    注意：无论 favorites 是空数组还是非空，都要保存，从而防止“删除到空”时 localStorage 仍残留旧数据。
  useEffect(() => {
    if (isAuthenticated && user) {
      const userId = user.userId || "default"
      const storageKey = `favorites_${userId}`

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(favorites))
      } catch (err) {
        console.error("写入 localStorage 失败:", err)
      }
    }
    // 如果需要在登出时立即删除 localStorage，可在这里加上 else 分支：
    // else {
    //   const userId = user?.userId || "default"
    //   window.localStorage.removeItem(`favorites_${userId}`)
    // }
  }, [favorites, isAuthenticated, user])

  // 添加到收藏：只针对已登录用户。若已存在则不重复添加。
  const addToFavorites = (drama) => {
    if (!isAuthenticated) return false

    const dramaId = drama._id || drama.id
    if (!dramaId) {
      console.error("Дорама не имеет идентификатора:", drama)
      return false
    }

    // 如果尚未在 favorites 中，才添加
    if (!favorites.some((fav) => fav._id === dramaId || fav.id === dramaId)) {
      const normalizedDrama = {
        _id: dramaId,
        id: dramaId,
        title: drama.title || "Без названия",
        description: drama.description || "",
        image: drama.image || "",
        genre: Array.isArray(drama.genre) ? drama.genre : [],
        releaseDate: drama.releaseDate || new Date().toISOString(),
        rating: drama.rating || 0,
      }

      setFavorites((prev) => [...prev, normalizedDrama])
      return true
    }

    return false
  }

  // 从收藏中移除：只对已登录用户有效
  const removeFromFavorites = (dramaId) => {
    if (!isAuthenticated) return false

    setFavorites((prev) =>
      prev.filter((d) => d._id !== dramaId && d.id !== dramaId)
    )
    return true
  }

  // 判断某部剧是否已被收藏
  const isFavorite = (dramaId) => {
    return favorites.some((d) => d._id === dramaId || d.id === dramaId)
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}
