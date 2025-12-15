import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import {apiStatusCode} from "../lib/apiCode.lib";

export const validateZod = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = schema.parse({ body: req.body, query: req.query, params: req.params }) as any;
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
        return next();
    } catch (error: any) {
        let errorMessage = 'Invalid request';
        
        if (error instanceof ZodError) {
            const issues = error.issues.map((err: any) => {
                const path = err.path.filter((p: any) => p !== 'body' && p !== 'query' && p !== 'params').join('.');
                return `${path || 'request'}: ${err.message}`;
            });
            errorMessage = issues.length > 0 ? issues.join(', ') : 'Invalid request';
        } else if (error.errors?.length) {
            errorMessage = error.errors.map((err: any) => err.message || err).join(', ');
        }
        
        return res.status(apiStatusCode.BadRequest).json({ ok: false, error: errorMessage });
    }
};