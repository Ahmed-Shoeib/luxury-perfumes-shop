export const createPerfume = async (req, res) => {
  try {
    const { name, brand, price, stock, description, category, gender, scentCategory } = req.body;
    const image = req.file ? req.file.filename : null;

    const perfume = new Perfume({
      name,
      brand,
      price,
      stock,
      description,
      category,
      gender,
      scentCategory,
      image,
    });

    await perfume.save();
    res.redirect("/admin");
  } catch (error) {
    console.error("Error creating perfume:", error);
    res.status(500).json({ error: "Error creating perfume" });
  }
};

export const updatePerfume = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, price, stock, description, category, gender, scentCategory } = req.body;
    const updateData = {
      name,
      brand,
      price,
      stock,
      description,
      category,
      gender,
      scentCategory,
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const perfume = await Perfume.findByIdAndUpdate(id, updateData, { new: true });
    if (!perfume) {
      return res.status(404).json({ error: "Perfume not found" });
    }

    res.redirect("/admin");
  } catch (error) {
    console.error("Error updating perfume:", error);
    res.status(500).json({ error: "Error updating perfume" });
  }
};

export const getPerfumes = async (req, res) => {
  try {
    const { category, gender, scentCategory, search } = req.query;
    let query = {};

    if (category && category !== "All Categories") {
      query.category = category;
    }

    if (gender && gender !== "All Genders") {
      query.gender = gender;
    }

    if (scentCategory && scentCategory !== "All Scents") {
      query.scentCategory = scentCategory;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const perfumes = await Perfume.find(query);
    res.json(perfumes);
  } catch (error) {
    console.error("Error fetching perfumes:", error);
    res.status(500).json({ error: "Error fetching perfumes" });
  }
}; 