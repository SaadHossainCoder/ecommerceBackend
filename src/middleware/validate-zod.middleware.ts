import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import {apiStatusCode} from "../lib/apiCode.lib";
export const validateZod = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = schema.parse({ body: req.body, query: req.query, params: req.params }) as any;
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
        return next();
    } catch (error: any) {
        return res.status(apiStatusCode.BadRequest).json({ error: error.errors || 'Invalid request' });
    };
};