// routes/adminUsers.js

import express from "express";
import User from "../models/users.js";
import RevokedToken from "../models/token.js";
import jwt from "jsonwebtoken";
import { authenticateToken, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// 注意：此路由文件所有路由都已经在 server.js 中，
// 挂载时会加上前缀 /api/admin/users，
// 并且会走 authenticateToken、adminOnly 中间件校验

/**
 * @route   GET /api/admin/users
 * @desc    管理员获取所有用户（不返回密码字段）
 * @access  Admin Only
 */
router.get("/", async (req, res) => {
  try {
    // 查询时剔除 password 字段：select("-password")
    const users = await User.find().select("-password");
    // 可以按需过滤，只保留 _id、username、role、createdAt、updatedAt 等
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "获取用户列表失败" });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    管理员删除指定用户
 * @access  Admin Only
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 先检查用户是否存在（可选）
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    // 不能让管理员删掉自己，也可以做额外校验
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ success: false, message: "不能删除自己" });
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "用户已删除" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "删除用户失败" });
  }
});

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    管理员修改指定用户的角色
 * @access  Admin Only
 */
router.patch("/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // 校验传过来的 role 是否合法
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ success: false, message: "无效的角色值" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    // 如果想要防止把最后一个管理员降级，可以在此做额外逻辑
    // 例如：如果当前修改的用户本来是 admin，且数据库中只有一个 admin 时，不允许删除
    // 这里先省略该逻辑，直接修改

    user.role = role;
    await user.save();
    res.json({ success: true, message: "用户角色已更新" });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ success: false, message: "修改用户角色失败" });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    管理员新增用户（可以同时设置初始角色）
 * @access  Admin Only
 */
router.post("/", async (req, res) => {
  const { username, password, role = "user" } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "用户名和密码不能为空" });
  }
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ success: false, message: "无效的角色值" });
  }

  try {
    // 判断用户名是否已存在
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ success: false, message: "用户名已存在" });
    }

    // 创建新用户
    const newUser = new User({ username, password, role });
    await newUser.save();

    // 返回给前端不包含密码的用户信息
    res
      .status(201)
      .json({
        success: true,
        user: {
          id: newUser._id,
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
  } catch (error) {
    console.error("Error creating user by admin:", error);
    res.status(500).json({ success: false, message: "新增用户失败" });
  }
});

export default router;
