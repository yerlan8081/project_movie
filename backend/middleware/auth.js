import jwt from "jsonwebtoken"
import RevokedToken from "../models/token.js"

// 🛡️ Token 验证中间件
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.header("authorization")
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "Token not provided" })
  }

  try {
    // 1. 检查 token 是否已注销（revoked）
    const revoked = await RevokedToken.exists({ token })
    if (revoked) {
      return res.status(403).json({ success: false, message: "Token is revoked" })
    }

    // 2. 验证 token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, message: "Invalid token" })
      }

      // 将解码后的用户信息保存在请求对象中
      req.user = user
      next()
    })
  } catch (error) {
    console.error("Unexpected error in authentication middleware:", error)
    res.status(500).json({ success: false, message: "Authentication failed" })
  }
}

// 👑 仅管理员权限
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" })
  }
  next()
}
