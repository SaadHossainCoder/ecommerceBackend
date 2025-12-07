import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token" });
    }

    if (!process.env.JWT_SECRET) {
        console.error("🔥 JWT_SECRET is not defined in .env file");
        return res.status(500).json({ error: "Internal Server Error: JWT secret is not configured." });
    }

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.user = data;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }
};