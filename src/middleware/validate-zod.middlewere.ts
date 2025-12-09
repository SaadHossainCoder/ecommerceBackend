import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod/v3";

export const validateZod = (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    try {
    const parsed = schema.parse({body : req.body, query: req.query, params: req.params});
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    return next();
    } catch (error : any) {
    return res.status(400).json({ error: error.errors || 'Invalid request' });
    };
};