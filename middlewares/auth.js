import jwt from "jsonwebtoken";
import User from "../models/user.js"

export default function (allowedRoles) {
  allowedRoles = allowedRoles || [];

  return async function (req, res, next) {
    try {
      const token = req.cookies.token;

      if (!token) {
        // return res.status(401).json({ message: "No token provided" });
        return res.status(401).redirect("/")
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        // return res.status(403).json({ message: "Forbidden: Access denied" });
        return res.status(403).redirect("/")
      }

      req.user = await User.findById(decoded.id)
      next();
    } catch (error) {
      res
        .status(401)
        .json({ message: "Invalid or expired token", error: error.message });
    }
  };
}
