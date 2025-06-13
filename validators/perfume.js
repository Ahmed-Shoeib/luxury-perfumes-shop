import mongoose from "mongoose";

const perfumeProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Perfume name is required"],
      trim: true,
      minLength: [1, "Name must not be empty"],
      maxLength: [100, "Name must be under 100 characters"],
    },
    brand: {
      type: String,
      trim: true,
      default: "Unknown",
      maxLength: [100, "Brand name too long"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock can't be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
    description: {
      type: String,
      maxLength: [1000, "Description too long"],
    },
    image: {
      type: String,
      validate: {
        validator: (v) =>
          !v ||
          /^(\/img\/uploads\/perfumes\/[\w-]+\.(jpg|gif|png|jpeg)$)|(^https?:\/\/.+\.(jpg|gif|png|jpeg)$)/.test(
            v
          ),
        message:
          "Image must be a valid path or URL ending in .jpg, .png, .gif, or .jpeg",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Eau de Parfum",
          "Eau de Toilette",
          "Eau de Cologne",
          "Perfume Oil",
          "Body Mist",
          "Gift Set",
          "Unisex",
          "Miniature",
        ],
        message:
          "Category must be one of: Eau de Parfum, Eau de Toilette, Eau de Cologne, Perfume Oil, Body Mist, Gift Set, Unisex, Miniature",
      },
      trim: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["Men", "Women", "Unisex"],
        message: "Gender must be one of: Men, Women, Unisex",
      },
      trim: true,
    },
    scentCategory: {
      type: String,
      required: [true, "Scent category is required"],
      enum: {
        values: ["Floral", "Oriental", "Woody", "Fresh", "Citrus", "Spicy", "Gourmand", "Aquatic", "Aromatic"],
        message: "Scent category must be one of: Floral, Oriental, Woody, Fresh, Citrus, Spicy, Gourmand, Aquatic, Aromatic",
      },
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PerfumeProduct", perfumeProductSchema);
