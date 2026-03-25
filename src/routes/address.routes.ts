import { Router } from "express";
import * as addressController from "../controllers/address.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as addressZod from "../validators/address.zod";
import { authGuard } from "../middleware/auth.guard";

const addressRouter = Router();

// All address routes require at least 'USER' role
addressRouter.use(authGuard(['USER']));

addressRouter.get("/", addressController.getAddressesByUser);
addressRouter.get("/:id", addressController.getAddressById);
addressRouter.post("/", validateZod(addressZod.createAddressSchema), addressController.createAddress);
addressRouter.put("/:id", validateZod(addressZod.updateAddressSchema), addressController.updateAddress);
addressRouter.patch("/:id/default", addressController.setDefaultAddress);
addressRouter.delete("/:id", addressController.deleteAddress);

export default addressRouter;
