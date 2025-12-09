import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ ok: false, message: 'Authorization header missing' });
    };

    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ ok: false, message: "Invalid Authorization format" });
    }

    const token = parts[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = payload;

        // if (roles.length && !roles.includes(payload.role)) return res.status(403).json({ ok: false, message: "Forbidden" });
        next();
    } catch (error) {
        return res.status(401).json({ ok: false, message: "Invalid or expired token" });
    }
};