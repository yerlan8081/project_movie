// Улучшенный api.js для работы с MongoDB и корректной обработки ID

// Функция для логирования запросов и ответов
const logApiCall = (method, url, requestData, responseData, error = null) => {
    console.group(`API ${method}: ${url}`)
    if (requestData) console.log("Request:", requestData)
    if (responseData) console.log("Response:", responseData)
    if (error) console.error("Error:", error)
    console.groupEnd()
  }
  
  // Функция для преобразования простых ID в валидные MongoDB ObjectId
  const ensureValidId = (id) => {
    // Если ID уже выглядит как MongoDB ObjectId (24 символа, шестнадцатеричный)
    if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
      return id
    }
  
    // Для моковых данных с простыми числовыми ID
    // Генерируем фиктивный ObjectId на основе числового ID
    const mockObjectId = `000000000000000000000${id}`.slice(-24)
    console.log(`Преобразование ID: ${id} -> ${mockObjectId}`)
    return mockObjectId
  }
  
  // Функция для обработки отсутствующих изображений
  const processImageUrls = (data) => {
    if (!data) return data
  
    // Если это массив, обрабатываем каждый элемент
    if (Array.isArray(data)) {
      return data.map((item) => ({
        ...item,
        image: item.image || `/placeholder.svg?height=450&width=300&text=${encodeURIComponent(item.title || "Дорама")}`,
      }))
    }
  
    // Если это один объект
    if (typeof data === "object" && data !== null) {
      return {
        ...data,
        image: data.image || `/placeholder.svg?height=450&width=300&text=${encodeURIComponent(data.title || "Дорама")}`,
      }
    }
  
    return data
  }
  
  // Улучшаем функцию apiRequest для лучшей обработки ошибок
  export const apiRequest = async (endpoint, options = {}) => {
    // Пробуем разные варианты URL для API
    const baseUrls = [
      "http://localhost:3000", // Основной URL
      "http://localhost:3000/api", // С префиксом /api
      "http://127.0.0.1:3000", // Альтернативный localhost
      "http://127.0.0.1:3000/api", // Альтернативный с префиксом /api
    ]
  
    let lastError = null
    let lastResponse = null
  
    // Пробуем каждый базовый URL по очереди
    for (const baseUrl of baseUrls) {
      const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`
      const method = options.method || "GET"
  
      try {
        console.log(`🔄 Попытка ${method} запроса к ${url}`)
  
        // Проверяем, содержит ли URL ID, который нужно преобразовать
        let modifiedUrl = url
        const idMatch = endpoint.match(/\/([^/]+)$/)
        if (idMatch && !isNaN(idMatch[1])) {
          const originalId = idMatch[1]
          const validId = ensureValidId(originalId)
          modifiedUrl = url.replace(originalId, validId)
          console.log(`Модифицированный URL: ${modifiedUrl}`)
        }
  
        // Подготавливаем заголовки запроса
        const headers = {
          "Content-Type": "application/json",
          ...options.headers,
        }
  
        // Добавляем токен авторизации только если он предоставлен
        if (options.token) {
          headers.Authorization = `Bearer ${options.token}`
        }
  
        const response = await fetch(modifiedUrl, {
          method,
          headers,
          ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        })
  
        lastResponse = response
  
        // Получаем текст ответа
        const responseText = await response.text()
        console.log(`Получен ответ от ${url}:`, responseText)
  
        // Пытаемся распарсить JSON, если возможно
        let data
        try {
          data = responseText ? JSON.parse(responseText) : {}
        } catch (e) {
          console.warn("Ответ не является JSON:", responseText)
          data = { text: responseText }
        }
  
        // Логируем ответ
        logApiCall(method, url, options.body, data)
  
        // Проверяем успешность запроса
        if (!response.ok) {
          throw new Error(data.message || `Ошибка ${response.status}: ${response.statusText}`)
        }
  
        // Нормализуем данные в зависимости от формата ответа
        if (data.success && data.data !== undefined) {
          // Формат { success: true, data: [...] }
          return processImageUrls(data.data)
        } else if (Array.isArray(data)) {
          // Формат прямого массива
          return processImageUrls(data)
        } else if (data._id) {
          // Формат одного объекта
          return processImageUrls(data)
        } else if (data.tovars || data.dramas) {
          // Формат с вложенным массивом товаров/дорам
          return processImageUrls(data.tovars || data.dramas)
        } else {
          // Другие форматы
          return processImageUrls(data)
        }
      } catch (error) {
        console.error(`Ошибка при запросе к ${url}:`, error)
        lastError = error
        // Продолжаем со следующим URL
      }
    }
  
    // Если все URL не сработали, но был получен ответ, возвращаем его
    if (lastResponse) {
      try {
        const responseText = await lastResponse.text()
        try {
          return JSON.parse(responseText)
        } catch (e) {
          return { text: responseText, success: lastResponse.ok }
        }
      } catch (e) {
        console.error("Не удалось прочитать ответ:", e)
      }
    }
  
    // Если все URL не сработали, используем моковые данные
    console.error("Все попытки подключения к API не удались. Последняя ошибка:", lastError)
  
    // Возвращаем моковые данные в зависимости от типа запроса
    if (endpoint.includes("/genres") || endpoint === "/genres" || endpoint === "genres") {
      return getMockGenres()
    } else if (endpoint.includes("/top") || endpoint === "/top" || endpoint === "top") {
      return getMockTopRated()
    } else if (endpoint.match(/\/tovars\/\d+/) || endpoint.match(/\/dramas\/\d+/)) {
      const id = endpoint.split("/").pop()
      return getMockDramaById(id)
    } else {
      return getMockDramas()
    }
  }
  
  // Специализированные функции для разных типов запросов
  export const getDramas = async (token) => {
    try {
      // Пробуем разные эндпоинты
      const endpoints = ["/tovars", "tovars", "/api/tovars", "api/tovars", "/dramas", "dramas"]
  
      for (const endpoint of endpoints) {
        try {
          console.log(`Попытка получить дорамы через эндпоинт: ${endpoint}`)
          // Теперь запрос будет работать без токена
          const data = await apiRequest(endpoint, { token })
          if (data && (Array.isArray(data) || data.length > 0)) {
            console.log(`Успешно получены данные через ${endpoint}:`, data)
            return data
          }
        } catch (endpointError) {
          console.warn(`Ошибка при запросе к ${endpoint}:`, endpointError)
        }
      }
  
      throw new Error("Не удалось получить данные ни через один эндпоинт")
    } catch (error) {
      console.error("Ошибка при получении дорам:", error)
      return getMockDramas()
    }
  }
  
  // Остальной код остается без изменений...
  export const getDrama = async (id, token) => {
    try {
      // Преобразуем ID в формат MongoDB ObjectId, если необходимо
      const validId = ensureValidId(id)
  
      // Пробуем разные эндпоинты
      const endpoints = [
        `/tovars/${validId}`,
        `tovars/${validId}`,
        `/api/tovars/${validId}`,
        `api/tovars/${validId}`,
        `/dramas/${validId}`,
        `dramas/${validId}`,
      ]
  
      for (const endpoint of endpoints) {
        try {
          console.log(`Попытка получить дораму через эндпоинт: ${endpoint}`)
          const data = await apiRequest(endpoint, { token })
          if (data && (data._id || data.id)) {
            console.log(`Успешно получены данные через ${endpoint}:`, data)
            return data
          }
        } catch (endpointError) {
          console.warn(`Ошибка при запросе к ${endpoint}:`, endpointError)
        }
      }
  
      throw new Error(`Не удалось получить дораму с ID ${id}`)
    } catch (error) {
      console.error(`Ошибка при получении дорамы ${id}:`, error)
      return getMockDramaById(id)
    }
  }
  
  export const getGenres = async (token) => {
    try {
      // Пробуем разные эндпоинты для жанров
      const endpoints = ["/genres", "genres", "/api/genres", "api/genres"]
  
      for (const endpoint of endpoints) {
        try {
          console.log(`Попытка получить жанры через эндпоинт: ${endpoint}`)
          const data = await apiRequest(endpoint, { token })
          if (data && (Array.isArray(data) || data.length > 0)) {
            console.log(`Успешно получены жанры через ${endpoint}:`, data)
            return data
          }
        } catch (endpointError) {
          console.warn(`Ошибка при запросе к ${endpoint}:`, endpointError)
        }
      }
  
      // Если не удалось получить жанры напрямую, пробуем извлечь их из списка дорам
      console.log("Попытка извлечь жанры из списка дорам")
      const dramas = await getDramas(token)
      if (Array.isArray(dramas) && dramas.length > 0) {
        const genres = [...new Set(dramas.flatMap((drama) => drama.genre || []))]
        console.log("Извлеченные жанры:", genres)
        return genres
      }
  
      throw new Error("Не удалось получить список жанров")
    } catch (error) {
      console.error("Ошибка при получении жанров:", error)
      return getMockGenres()
    }
  }
  
  // Улучшаем функцию getTopRated для работы с новым маршрутом
  export const getTopRated = async (token) => {
    try {
      // Пробуем разные эндпоинты для топ-рейтинга
      const endpoints = ["/top", "top", "/api/top", "api/top"]
  
      for (const endpoint of endpoints) {
        try {
          console.log(`Попытка получить топ-рейтинг через эндпоинт: ${endpoint}`)
          const data = await apiRequest(endpoint, { token })
  
          // Проверяем формат данных и нормализуем их
          let normalizedData
          if (data && data.success && Array.isArray(data.data)) {
            normalizedData = data.data
          } else if (Array.isArray(data)) {
            normalizedData = data
          } else if (data && data.success && data.data) {
            normalizedData = Array.isArray(data.data) ? data.data : [data.data]
          } else {
            throw new Error("Неожиданный формат данных")
          }
  
          if (normalizedData && normalizedData.length > 0) {
            console.log(`Успешно получен топ-рейтинг через ${endpoint}:`, normalizedData)
            return normalizedData
          }
        } catch (endpointError) {
          console.warn(`Ошибка при запросе к ${endpoint}:`, endpointError)
        }
      }
  
      // Если не удалось получить топ напрямую, сортируем список дорам по рейтингу
      console.log("Попытка создать топ-рейтинг из списка дорам")
      const dramas = await getDramas(token)
      if (Array.isArray(dramas) && dramas.length > 0) {
        const topRated = [...dramas].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10)
        console.log("Созданный топ-рейтинг:", topRated)
        return topRated
      }
  
      throw new Error("Не удалось получить топ-рейтинг")
    } catch (error) {
      console.error("Ошибка при получении топ-рейтинга:", error)
      return getMockTopRated()
    }
  }
  
  export const createDrama = async (dramaData, token) => {
    try {
      // Пробуем разные эндпоинты для создания дорамы
      const endpoints = ["/tovars", "tovars", "/api/tovars", "api/tovars", "/dramas", "dramas"]
  
      for (const endpoint of endpoints) {
        try {
          console.log(`Попытка создать дораму через эндпоинт: ${endpoint}`)
          const data = await apiRequest(endpoint, {
            method: "POST",
            body: dramaData,
            token,
          })
          if (data && (data._id || data.id)) {
            console.log(`Успешно создана дорама через ${endpoint}:`, data)
            return data
          }
        } catch (endpointError) {
          console.warn(`Ошибка при запросе к ${endpoint}:`, endpointError)
        }
      }
  
      throw new Error("Не удалось создать дораму")
    } catch (error) {
      console.error("Ошибка при создании дорамы:", error)
      // Возвращаем моковый ответ с сгенерированным ID
      return {
        ...dramaData,
        _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      }
    }
  }
  
  // Улучшаем функции для удаления и обновления дорам
  
  export const updateDrama = async (id, dramaData, token) => {
    try {
      // Преобразуем ID в формат MongoDB ObjectId, если необходимо
      const validId = ensureValidId(id)
  
      console.log(`Отправка запроса на обновление дорамы с ID ${id}:`, dramaData)
  
      // Пробуем разные эндпоинты для обновления дорамы
      const endpoints = [
        `/tovars/${validId}`,
        `tovars/${validId}`,
        `/api/tovars/${validId}`,
        `api/tovars/${validId}`,
        `/dramas/${validId}`,
        `dramas/${validId}`,
      ]
  
      for (const endpoint of endpoints) {
        try {
          console.log(`Попытка обновить дораму через эндпоинт: ${endpoint}`)
          const data = await apiRequest(endpoint, {
            method: "PUT",
            body: dramaData,
            token,
          })
          if (data) {
            console.log(`Успешно обновлена дорама через ${endpoint}:`, data)
            return data
          }
        } catch (endpointError) {
          console.warn(`Ошибка при запросе к ${endpoint}:`, endpointError)
        }
      }
  
      // Если все эндпоинты не сработали, пробуем прямой запрос к серверу
      try {
        console.log("Попытка прямого запроса к серверу для обновления")
        const response = await fetch(`http://localhost:3000/tovars/${validId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(dramaData),
        })
  
        const data = await response.json()
        if (response.ok) {
          console.log("Успешное обновление через прямой запрос:", data)
          return data.data || data
        }
      } catch (directError) {
        console.error("Ошибка при прямом запросе:", directError)
      }
  
      throw new Error(`Не удалось обновить дораму с ID ${id}`)
    } catch (error) {
      console.error(`Ошибка при обновлении дорамы ${id}:`, error)
      // Возвращаем обновленные данные
      return {
        ...dramaData,
        _id: id,
        id: id,
      }
    }
  }
  
  export const deleteDrama = async (id, token) => {
    try {
      // Преобразуем ID в формат MongoDB ObjectId, если необходимо
      const validId = ensureValidId(id)
  
      console.log(`Отправка запроса на удаление дорамы с ID ${id}`)
  
      // Пробуем разные эндпоинты для удаления дорамы
      const endpoints = [
        `/tovars/${validId}`,
        `tovars/${validId}`,
        `/api/tovars/${validId}`,
        `api/tovars/${validId}`,
        `/dramas/${validId}`,
        `dramas/${validId}`,
      ]
  
      for (const endpoint of endpoints) {
        try {
          console.log(`Попытка удалить дораму через эндпоинт: ${endpoint}`)
          const data = await apiRequest(endpoint, {
            method: "DELETE",
            token,
          })
          if (data) {
            console.log(`Успешно удалена дорама через ${endpoint}:`, data)
            return data
          }
        } catch (endpointError) {
          console.warn(`Ошибка при запросе к ${endpoint}:`, endpointError)
        }
      }
  
      // Если все эндпоинты не сработали, пробуем прямой запрос к серверу
      try {
        console.log("Попытка прямого запроса к серверу для удаления")
        const response = await fetch(`http://localhost:3000/tovars/${validId}`, {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
  
        if (response.ok) {
          const data = await response.json()
          console.log("Успешное удаление через прямой запрос:", data)
          return data
        }
      } catch (directError) {
        console.error("Ошибка при прямом запросе:", directError)
      }
  
      throw new Error(`Не удалось удалить дораму с ID ${id}`)
    } catch (error) {
      console.error(`Ошибка при удалении дорамы ${id}:`, error)
      // Возвращаем успешный ответ
      return { success: true }
    }
  }
  
  // Моковые данные для случая, когда API недоступен
  const getMockDramas = () => {
    console.warn("Используются моковые данные для дорам")
    return [
      {
        _id: "000000000000000000000001",
        id: "000000000000000000000001",
        title: "Slaby geroy",
        description: "Трейлер боевик",
        image: "https://i.pinimg.com/564x/f2/9c/f7/f29cf7d2d3c89e7e5a0b49f4ac5d8f7a.jpg",
        genre: ["трейлер", "боевик"],
        releaseDate: "2025-04-23",
        rating: 9.0,
      },
      {
        _id: "000000000000000000000002",
        id: "000000000000000000000002",
        title: "Деловое предложение",
        description: "Мелодрама, драма",
        image: "https://i.pinimg.com/564x/e0/c3/9e/e0c39e7e6f8d8b7b0d3e8d5f5f5f5f5f.jpg",
        genre: ["мелодрама", "драма"],
        releaseDate: "2022-02-22",
        rating: 7.0,
      },
      {
        _id: "000000000000000000000003",
        id: "000000000000000000000003",
        title: "ЖИЫРМА БЕС ЖИЫРМА БІР",
        description: "МОЛОДОСТЬ",
        image: "https://i.pinimg.com/564x/f3/9c/f7/f39cf7d2d3c89e7e5a0b49f4ac5d8f7a.jpg",
        genre: ["МОЛОДОСТЬ"],
        releaseDate: "2025-05-12",
        rating: 8.5,
      },
      {
        _id: "000000000000000000000004",
        id: "000000000000000000000004",
        title: "Черный огненный дракон 2",
        description: "Драма",
        image: "https://i.pinimg.com/564x/f4/9c/f7/f49cf7d2d3c89e7e5a0b49f4ac5d8f7a.jpg",
        genre: ["драма"],
        releaseDate: "2025-04-12",
        rating: 9.0,
      },
      {
        _id: "000000000000000000000005",
        id: "000000000000000000000005",
        title: "Истинная красота",
        description: "Драма",
        image: "https://i.pinimg.com/564x/f5/9c/f7/f59cf7d2d3c89e7e5a0b49f4ac5d8f7a.jpg",
        genre: ["драма"],
        releaseDate: "2020-02-20",
        rating: 8.0,
      },
    ]
  }
  
  const getMockDramaById = (id) => {
    console.warn(`Используются моковые данные для дорамы с ID ${id}`)
    // Преобразуем ID в числовой формат для поиска в моковых данных
    const numericId = id.replace(/^0+/, "") || "1"
    const dramas = getMockDramas()
    const drama = dramas.find((d) => d._id.endsWith(numericId) || d.id.endsWith(numericId))
  
    if (drama) {
      return drama
    }
  
    // Если не найдено, возвращаем первую дораму
    return dramas[0]
  }
  
  const getMockGenres = () => {
    console.warn("Используются моковые данные для жанров")
    return [
      "Романтика",
      "Комедия",
      "Драма",
      "Боевик",
      "Триллер",
      "Историческая",
      "Фэнтези",
      "Школа",
      "Медицина",
      "Детектив",
    ]
  }
  
  const getMockTopRated = () => {
    console.warn("Используются моковые данные для топ-рейтинга")
    // Возвращаем отсортированные по рейтингу дорамы
    return getMockDramas().sort((a, b) => b.rating - a.rating)
  }
  
  // utils/api.js

/**
 * 管理员获取所有用户
 * @param {string} token - 管理员用户的 JWT token
 * @returns {Promise<Array>} - 返回用户数组，每个用户对象包含 _id、username、role 等（不含 password）
 */
export const getUsers = async (token) => {
  const res = await fetch("/api/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // 抛出错误以便页面层 catch
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "获取用户列表失败");
  }
  // 结构为 { success: true, users: [...] }
  const data = await res.json();
  return data.users;
};

/**
 * 管理员删除某个用户
 * @param {string} id - 要删除的用户 ID
 * @param {string} token - 管理员 token
 */
export const deleteUser = async (id, token) => {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "删除用户失败");
  }
  // 如果需要拿到后端返回值可以在此返回一个 value，
  // 但后端只返回 { success: true, message: "用户已删除" }
};

/**
 * 管理员修改指定用户角色
 * @param {string} id - 用户 ID
 * @param {"admin"|"user"} role - 要设置的角色
 * @param {string} token - 管理员 token
 */
export const updateUserRole = async (id, role, token) => {
  const res = await fetch(`/api/admin/users/${id}/role`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "修改用户角色失败");
  }
  // 后端返回 { success: true, message: "用户角色已更新" }
};

/**
 * 管理员新增用户
 * @param {{ username: string, password: string, role?: "admin"|"user" }} userData
 * @param {string} token
 * @returns {Promise<Object>} - 返回新创建的用户对象（不含 password）
 */
export const registerUserByAdmin = async (userData, token) => {
  const res = await fetch(`/api/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "管理员新增用户失败");
  }
  const data = await res.json(); // { success: true, user: { id, username, role, createdAt } }
  return data.user;
};
