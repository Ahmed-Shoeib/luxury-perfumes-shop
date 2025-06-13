import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PerfumeProduct",
      required: [true, "Product reference is required"],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be a positive number"],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minLength: [2, "Name must be at least 2 characters long"],
      maxLength: [50, "Name can't be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, "Please enter a valid phone number"],
      required: false,
    },
    address: {
      type: String,
      trim: true,
      maxLength: [200, "Address can't be more than 200 characters"],
      required: false,
    },
    creditCardLastFour: {
      type: String,
      trim: true,
      match: [/^[0-9]{4}$/, "Credit card last four digits must be exactly 4 numbers"],
      required: false,
    },
    idPhoto: {
      type: String,
      required: false,
      validate: {
        validator: (v) =>
          !v ||
          /^(\/img\/uploads\/users\/[\w-]+\.(jpg|gif|png|jpeg)$)|(^https?:\/\/.+\.(jpg|gif|png|jpeg)$)/.test(
            v
          ),
        message:
          "ID Photo must be a valid path or URL ending in .jpg, .png, .gif, or .jpeg",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    cart: {
      items: {
        type: [cartItemSchema],
        default: [],
      },
      totalPrice: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
