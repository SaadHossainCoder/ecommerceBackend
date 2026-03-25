import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express";

export const authGuard =
  (roles: string[] = []) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {

    const header = req.headers.authorization;

    // 🔒 1. Check header
    if (!header) {
      return res.status(401).json({
        ok: false,
        message: "Authorization header missing",
      });
    }

    // 🔒 2. Validate format
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        ok: false,
        message: "Invalid Authorization format",
      });
    }

    try {
      // 🔒 3. Check secret
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not defined");
      }

      // 🔒 4. Verify token
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET
      ) as { id: string; role: string };

      req.user = payload;

      // 🔒 5. Role check
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