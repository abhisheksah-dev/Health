import express from 'express';
import { register, login,refreshToken,logout,updateUser } from '../controller/authController.js'

import authMiddleware from '../middleware/authmiddleware.js';
import e from 'express';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authMiddleware, logout);
router.put('/update', authMiddleware, updateUser);
router.get('/profile', authMiddleware, (req, res) => {
    res.json(req.user);
});

export default router;