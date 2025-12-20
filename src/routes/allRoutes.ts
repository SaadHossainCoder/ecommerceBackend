import { Router } from "express";
import userRouter from "./user.routes";

const rootRouter: Router = Router();

rootRouter.use("/auth", userRouter );

export default rootRouter;