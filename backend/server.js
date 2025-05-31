import express from "express"
import helmet from "helmet"
import cors from "cors"
import { connectDB } from "./db/config.js"
import tovarRoutes from "./routes/tovar.js"
import userRoutes from "./routes/users.js"
import adminUserRoutes from "./routes/adminUsers.js" // 新增 admin 用户管理路由
import { authenticateToken, adminOnly } from "./middleware/auth.js"
import dotenv from "dotenv"

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(helmet())
app.use(express.json())

// Connect to MongoDB
connectDB()

// Public routes for dramas
app.get("/tovars", async (req, res) => {
  try {
    const Tovar = (await import("./models/tovar.js")).default
    const tovar = await Tovar.find({})
    res.status(200).json({ success: true, data: tovar })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

app.get("/tovars/:id", async (req, res) => {
  const { id } = req.params
  try {
    const Tovar = (await import("./models/tovar.js")).default
    const tovar = await Tovar.findById(id)
    if (!tovar) {
      return res.status(404).json({ success: false, message: "Tovar not found" })
    }
    res.status(200).json({ success: true, data: tovar })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

app.get("/top", async (req, res) => {
  try {
    const Tovar = (await import("./models/tovar.js")).default
    const topDramas = await Tovar.find({}).sort({ rating: -1 }).limit(10)
    res.status(200).json({ success: true, data: topDramas })
  } catch (error) {
    console.error("Top dramas error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

app.get("/api/top", async (req, res) => {
  try {
    const Tovar = (await import("./models/tovar.js")).default
    const topDramas = await Tovar.find({}).sort({ rating: -1 }).limit(10)
    res.status(200).json({ success: true, data: topDramas })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Authenticated drama routes
app.use("/tovars", authenticateToken, tovarRoutes)

// User auth and public routes
app.use("/", userRoutes)

// Admin user management routes
app.use("/api/admin/users", authenticateToken, adminOnly, adminUserRoutes)

// Admin panel test route
app.get("/admin", authenticateToken, adminOnly, (req, res) => {
  res.json({ success: true, message: "Welcome to the admin panel" })
})

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
})

// Start server
app.listen(3000, () => console.log("Server is running on port 3000"))
