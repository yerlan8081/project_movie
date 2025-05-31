import express from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import User from "../models/users.js"
import RevokedToken from "../models/token.js"
import { authenticateToken, adminOnly } from "../middleware/auth.js"

dotenv.config()
const router = express.Router()

// 登录
router.post("/login", async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Please provide username and password" })
  }

  try {
    const user = await User.findOne({ username })
    if (!user || !(await user.comparePasswords(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" })
    res.json({ success: true, token })
  } catch (error) {
    console.error("Login failed:", error)
    res.status(500).json({ success: false, message: "Login failed" })
  }
})

// 注册（普通注册）
router.post("/register", async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Please provide username and password" })
  }

  try {
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already exists" })
    }

    const newUser = new User({ username, password })
    await newUser.save()

    res.status(201).json({ success: true, message: "User registered successfully" })
  } catch (error) {
    console.error("Registration failed:", error)
    res.status(500).json({ success: false, message: "Registration failed" })
  }
})

// 登出
router.post("/logout", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]

  if (token) {
    try {
      const decoded = jwt.decode(token)
      if (decoded && decoded.exp) {
        await RevokedToken.create({ token, expiresAt: new Date(decoded.exp * 1000) })
      }
      res.json({ success: true, message: "Logged out successfully" })
    } catch (error) {
      console.error("Logout error:", error)
      res.status(500).json({ success: false, message: "Logout failed" })
    }
  } else {
    res.status(404).json({ success: false, message: "No token provided" })
  }
})

// 管理员面板测试
// router.get("/admin", authenticateToken, adminOnly, (req, res) => {
//   res.json({ success: true, message: "Welcome to admin panel" })
// })

// /* ------------------ 管理员用户管理功能 ------------------ */

// // 获取所有用户
// router.get("/users", authenticateToken, adminOnly, async (req, res) => {
//   try {
//     const users = await User.find().select("-password")
//     res.json(users)
//   } catch (error) {
//     console.error("Error fetching users:", error)
//     res.status(500).json({ message: "Failed to get users" })
//   }
// })

// // 删除用户
// router.delete("/users/:id", authenticateToken, adminOnly, async (req, res) => {
//   try {
//     await User.findByIdAndDelete(req.params.id)
//     res.json({ success: true, message: "User deleted" })
//   } catch (error) {
//     console.error("Error deleting user:", error)
//     res.status(500).json({ success: false, message: "Failed to delete user" })
//   }
// })

// // 修改用户角色
// router.patch("/users/:id/role", authenticateToken, adminOnly, async (req, res) => {
//   const { role } = req.body
//   if (!["admin", "user"].includes(role)) {
//     return res.status(400).json({ success: false, message: "Invalid role" })
//   }

//   try {
//     const user = await User.findById(req.params.id)
//     if (!user) return res.status(404).json({ success: false, message: "User not found" })

//     user.role = role
//     await user.save()

//     res.json({ success: true, message: "User role updated" })
//   } catch (error) {
//     console.error("Error updating role:", error)
//     res.status(500).json({ success: false, message: "Failed to update role" })
//   }
// })

// // 管理员添加用户
// router.post("/users", authenticateToken, adminOnly, async (req, res) => {
//   const { username, password, role = "user" } = req.body
//   if (!username || !password) {
//     return res.status(400).json({ success: false, message: "Username and password required" })
//   }

//   try {
//     const exists = await User.findOne({ username })
//     if (exists) return res.status(400).json({ success: false, message: "Username already exists" })

//     const newUser = new User({ username, password, role })
//     await newUser.save()

//     res.status(201).json({
//       success: true,
//       user: {
//         id: newUser._id,
//         username: newUser.username,
//         role: newUser.role,
//       },
//     })
//   } catch (error) {
//     console.error("Admin create user error:", error)
//     res.status(500).json({ success: false, message: "Failed to create user" })
//   }
// })

export default router
