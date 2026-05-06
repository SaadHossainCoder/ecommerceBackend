// import { NextFunction, Request, Response } from "express";
// import aj from "../lib/security.lib";

// export const detectBotProtection = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const decision = await aj.protect(req);

//         if (decision.isDenied()) {
//             if (decision.reason.isBot()){
//                 return res.status(403).json({ error: "Bot detected!" });
//             }
//             return res.status(403).json({ error: "Access denied" });
//         }

//         next();
//     } catch (error) {
//         console.error("Arcjet error:", error);
//         next(); // Continue even if security check fails, or handle as error
//     }
// };