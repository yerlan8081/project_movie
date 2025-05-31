// src/pages/ManageUsers.js

import React, { useState, useEffect, useContext } from "react";
import { FaTrash, FaUserEdit, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { getUsers, deleteUser, updateUserRole, registerUserByAdmin } from "../utils/api";
import { AuthContext } from "../contexts/AuthContext";

const ManageUsers = () => {
  const { token } = useContext(AuthContext); // 从 Context 中获取当前登录的 token
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [editLoadingId, setEditLoadingId] = useState(null);

  // 表单数据：管理员新增用户时使用
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  // 编辑时：临时存储要修改角色的用户 ID 和角色
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");

  // 1. 加载所有用户列表
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers(token);
        setUsers(data);
      } catch (err) {
        console.error("加载用户列表失败", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, [token]);

  // 2. 处理删除用户
  const handleDelete = async (id) => {
    const confirm = window.confirm("确定要删除该用户吗？此操作不可恢复！");
    if (!confirm) return;

    try {
      setDeleteLoadingId(id);
      await deleteUser(id, token);
      // 删除后从前端列表中过滤掉
      setUsers((prev) => prev.filter((user) => user._id !== id));
      toast.success("用户已删除");
    } catch (err) {
      console.error("删除用户失败", err);
      toast.error(`删除失败：${err.message}`);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // 3. 处理修改用户角色（显示输入框或直接切换）
  const startEditRole = (user) => {
    setEditingUserId(user._id);
    setEditingRole(user.role);
  };
  const cancelEditRole = () => {
    setEditingUserId(null);
    setEditingRole("");
  };
  const confirmEditRole = async (id) => {
    try {
      setEditLoadingId(id);
      await updateUserRole(id, editingRole, token);
      // 更新前端列表中的该条记录
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: editingRole } : u))
      );
      toast.success("用户角色已更新");
      cancelEditRole();
    } catch (err) {
      console.error("修改用户角色失败", err);
      toast.error(`更新失败：${err.message}`);
    } finally {
      setEditLoadingId(null);
    }
  };

  // 4. 处理管理员新增用户
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.warn("用户名和密码不能为空");
      return;
    }
    try {
      const added = await registerUserByAdmin(
        { username: newUsername, password: newPassword, role: newRole },
        token
      );
      // 将新用户插入到列表前端
      setUsers((prev) => [added, ...prev]);
      toast.success("新增用户成功");
      // 重置表单
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
    } catch (err) {
      console.error("管理员新增用户失败", err);
      toast.error(`新增失败：${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <p>正在加载用户列表...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        <p>加载用户时出错：{error}</p>
      </div>
    );
  }

  return (
    <div className="manage-users-container" style={{ padding: "20px" }}>
      <h2>管理员：用户管理</h2>

      {/* —— 管理员新增用户表单 —— */}
      <div
        className="add-user-form"
        style={{
          margin: "20px 0",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          maxWidth: "400px",
        }}
      >
        <h3>
          <FaPlus /> 新增用户
        </h3>
        <form onSubmit={handleAddUser}>
          <div style={{ marginBottom: "8px" }}>
            <label>用户名：</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="请输入用户名"
              style={{ marginLeft: "10px", padding: "4px", width: "70%" }}
            />
          </div>
          <div style={{ marginBottom: "8px" }}>
            <label>密码：</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入初始密码"
              style={{ marginLeft: "16px", padding: "4px", width: "70%" }}
            />
          </div>
          <div style={{ marginBottom: "8px" }}>
            <label>角色：</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{ marginLeft: "14px", padding: "4px", width: "74%" }}
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <button type="submit" style={{ padding: "6px 12px" }}>
            新增
          </button>
        </form>
      </div>

      {/* —— 用户列表 —— */}
      {users.length === 0 ? (
        <p>当前没有用户。</p>
      ) : (
        <table
          className="users-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>用户名</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>角色</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>注册时间</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {user.username}
                </td>

                {/* 角色列：如果正在编辑该行，就显示下拉框；否则直接显示 role */}
                <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                  {editingUserId === user._id ? (
                    <select
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value)}
                      disabled={editLoadingId === user._id}
                      style={{ padding: "4px" }}
                    >
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  ) : (
                    user.role === "admin" ? "管理员" : "普通用户"
                  )}
                </td>

                <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                  {new Date(user.createdAt).toLocaleString()}
                </td>

                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {/* 编辑角色按钮：如果不是当前编辑行，则显示“编辑” */}
                  {editingUserId === user._id ? (
                    <>
                      <button
                        onClick={() => confirmEditRole(user._id)}
                        disabled={editLoadingId === user._id}
                        style={{
                          padding: "4px 8px",
                          background: "#4caf50",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        {editLoadingId === user._id ? "保存中..." : "保存"}
                      </button>
                      <button
                        onClick={cancelEditRole}
                        disabled={editLoadingId === user._id}
                        style={{
                          padding: "4px 8px",
                          background: "#aaa",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditRole(user)}
                      style={{
                        padding: "4px 8px",
                        background: "#2196f3",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      <FaUserEdit /> 编辑角色
                    </button>
                  )}

                  {/* 删除用户按钮 */}
                  <button
                    onClick={() => handleDelete(user._id)}
                    disabled={deleteLoadingId === user._id}
                    style={{
                      padding: "4px 8px",
                      background: "#f44336",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                    }}
                  >
                    {deleteLoadingId === user._id ? "删除中..." : <FaTrash />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageUsers;
