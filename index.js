import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDb from "./config/db.js";

import perfumesRouter from "./routes/perfume.js";
import ordersRouter from "./routes/order.js";
import usersRouter from "./routes/user.js";
import frontRouter from "./routes/frontend.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// ✅ API Routes
app.use("/api/perfume", perfumesRouter);      // ✅ changed from /api/book
app.use("/api/order", ordersRouter);
app.use("/api/user", usersRouter);
app.use(frontRouter);

// ✅ DB connection
connectDb();

app.listen(port, () => {
  console.log(`Perfume shop app listening on port ${port}`);
});
