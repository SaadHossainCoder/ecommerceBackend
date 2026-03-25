import { Request, Response, NextFunction } from "express";
import {apiStatusCode} from "../lib/apiCode.lib";
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(err.status || apiStatusCode.InternalServerError).json({ ok: false, message: err.message || "Server Error" });
};
