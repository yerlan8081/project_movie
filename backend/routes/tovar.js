import express from "express";
import Tovar from "../models/tovar.js"; // Убедитесь, что путь к модели правильный
import { authenticateToken, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Получить все товары
router.get("/", async (req, res) => {
  try {
    const tovar = await Tovar.find({});
    res.status(200).json({ success: true, data: tovar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Поиск товаров
router.get("/search", async (req, res) => {
  const query = req.query.q || "";
  const regex = new RegExp(query, "i");
  try {
    const tovar = await Tovar.find({ title: regex });
    res.status(200).json({ success: true, data: tovar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error searching tovar" });
  }
});

// Получить товар по ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const tovar = await Tovar.findById(id);
    if (!tovar) {
      return res.status(404).json({ success: false, message: "Tovar not found" });
    }
    res.status(200).json({ success: true, data: tovar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Добавить новый товар (только админ)
router.post("/", authenticateToken, adminOnly, async (req, res) => {
  const { title, description, image, genre, releaseDate, rating, type, videoUrl } = req.body;

  if (!title || !description || !image || !genre || !releaseDate || rating === undefined || !type) {
    return res.status(400).json({ success: false, message: "Please provide all required fields" });
  }

  if (!["serial", "movie"].includes(type)) {
    return res.status(400).json({ success: false, message: "Invalid type value" });
  }

  const newTovar = new Tovar({ title, description, image, genre, releaseDate, rating, type, videoUrl });

  try {
    await newTovar.save();
    res.status(201).json({ success: true, data: newTovar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error while saving new tovar" });
  }
});

// Обновить товар (только админ)
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { title, description, image, genre, releaseDate, rating, type, videoUrl } = req.body;

  if (!title || !description || !image || !genre || !releaseDate || rating === undefined || !type) {
    return res.status(400).json({ success: false, message: "Please provide all required fields" });
  }

  if (!["serial", "movie"].includes(type)) {
    return res.status(400).json({ success: false, message: "Invalid type value" });
  }

  try {
    const existingTovar = await Tovar.findById(id);
    if (!existingTovar) {
      return res.status(404).json({ success: false, message: "Tovar not found" });
    }

    const updatedTovar = await Tovar.findByIdAndUpdate(
      id,
      { title, description, image, genre, releaseDate, rating, type, videoUrl },
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedTovar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error while updating tovar" });
  }
});

// Удалить товар (только админ)
router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTovar = await Tovar.findByIdAndDelete(id);
    if (!deletedTovar) {
      return res.status(404).json({ success: false, message: "Tovar not found" });
    }
    res.status(200).json({ success: true, message: "Tovar deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error while deleting tovar" });
  }
});

export default router;
