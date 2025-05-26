import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

const setRefreshTokenCookie = (res, token) => {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};


const register = async (req, res) => {
    const { name,
        email,
        password,
        phone,
        role,
        profile } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || "user",
            profile
        });

        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        newUser.refreshToken = refreshToken;
        await newUser.save();

        setRefreshTokenCookie(res, refreshToken);

        res.status(201).json({
            success: true,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            },
            accessToken
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        setRefreshTokenCookie(res, refreshToken);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            accessToken
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken || req.body.token;

    if (!token) {
        return res.sendStatus(401);
    }

    try {
        const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(payload.id);

        if (!user || user.refreshToken !== token) {
            return res.sendStatus(403);
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        setRefreshTokenCookie(res, newRefreshToken);

        res.json({
            accessToken: newAccessToken
        });

    } catch (error) {
        res.status(403).json({
            success: false,
            message: "Invalid refresh token"
        });
    }
};


const logout = async (req, res) => {
    const token = req.cookies.refreshToken || req.body.token;
    if (!token) {
        return res.sendStatus(401);
    }

    try {
        const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(payload.id);

        if (!user || user.refreshToken !== token) {
            return res.sendStatus(403);
        }

        user.refreshToken = null;
        await user.save();

        res.clearCookie("refreshToken");
        res.status(200).json({ success: true, message: "Logged out successfully" });

    } catch (error) {
        res.status(403).json({
            success: false,
            message: "Invalid refresh token"
        });
    }
};


const updateUser = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { name, email, password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) {
            user.name = name.trim();
        }

        if (email) {
            const emailTaken = await User.findOne({ email });
            if (emailTaken && emailTaken._id.toString() !== userId) {
                return res.status(400).json({ message: "Email already in use." });
            }
            user.email = email.trim();
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export {
    register,
    login,
    refreshToken,
    logout,
    updateUser
};
