import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/user.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const refreshToken = req.cookies?.refreshToken;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    return next();
  } catch (error) {
    console.log(error.message);
    
    if (error.name !== "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid access token" });
    }

    if (!refreshToken) {
      return res.status(401).json({ message: "Please login again" });
    }

    try {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(payload.id).select("-password");
      
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const newAccessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );
      
      const newRefreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      user.refreshToken = newRefreshToken;
      await user.save();

      res.setHeader("x-access-token", newAccessToken);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      req.user = user;
      return next();
    } catch (error) {
      res.clearCookie("refreshToken");
      return res.status(403).json({ 
        message: "Session expired. Please login again."
      });
    }
  }
};

export default authMiddleware;
// const authMiddleware = async (req, res, next) => {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//         return res.status(401).json({ message: "Unauthorized" });
//     }
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id).select("-password");
//         if (!user) {
//             return res.status(401).json({ message: "Unauthorized" });
//         }
//         req.user = user;
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: "Unauthorized" });
//     }
// }

// export default authMiddleware;