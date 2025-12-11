import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {apiStatusCode} from "../lib/apiCode.lib";

export const authGuard = (roles: string[] = []) => (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(apiStatusCode.NotFound).json({ ok: false, message: 'Authorization header missing' });
    };

    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(apiStatusCode.NotMatched).json({ ok: false, message: "Invalid Authorization format" });
    }

    const token = parts[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };
        (req as any).user = payload;

        if (roles.length && !roles.includes(payload.role)) return res.status(apiStatusCode.NotMatched).json({ ok: false, message: "Forbidden" });
        next();
    } catch (error) {
        return res.status(apiStatusCode.Unauthorized).json({ ok: false, message: "Invalid or expired token" });
    }
};