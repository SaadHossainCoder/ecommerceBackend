import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express";
import { verifyAccessToken } from "../utils/token.utils";

export const authGuard =
  (roles: string[] = []) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {

    const token = req.cookies.accessToken;

    // 🔒 1. Check cookie
    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized: Missing access token cookie",
      });
    }

    try {
      // 🔒 2. Verify token using utility
      const payload = verifyAccessToken(token) as { id: string; role: string };

      req.user = payload;

      // 🔒 3. Role check
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({
          ok: false,
          message: "Forbidden: Access denied",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        ok: false,
        message: "Invalid or expired token",
      });
    }
  };