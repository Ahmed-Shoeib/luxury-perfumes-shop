import PerfumeProduct from "../models/perfume.js";
import { validationResult } from "express-validator";

// CREATE perfume
export const createPerfume = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const perfumeData = {
      ...req.body,
      image: req.file ? `/img/uploads/perfumes/${req.file.filename}` : null,
    };

    const perfume = await PerfumeProduct.create(perfumeData);
    res.status(201).json(perfume);
  } catch (err) {
    console.error("Error creating perfume:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET all perfumes
export const getPerfumes = async (req, res) => {
  const perfumes = await PerfumeProduct.find();
  res.json(perfumes);
};

// GET single perfume by ID
export const getPerfume = async (req, res) => {
  const perfume = await PerfumeProduct.findById(req.params.id);
  if (!perfume) return res.status(404).json({ message: "Perfume not found" });
  res.json(perfume);
};

// UPDATE perfume
export const updatePerfume = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/img/uploads/perfumes/${req.file.filename}`;
    }

    const perfume = await PerfumeProduct.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!perfume) return res.status(404).json({ message: "Perfume not found" });
    res.json(perfume);
  } catch (err) {
    console.error("Error updating perfume:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE perfume
export const deletePerfume = async (req, res) => {
  const perfume = await PerfumeProduct.findByIdAndDelete(req.params.id);
  if (!perfume) return res.status(404).json({ message: "Perfume not found" });
  res.json({ message: "Perfume deleted" });
};
