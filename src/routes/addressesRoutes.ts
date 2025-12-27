import express from "express";
import validateRequest from "../middleware/validateRequest";
import { createAddressSchema, updateAddressSchema } from "../utils/validate";
import {
  createAddress,
  deleteAddress,
  getAddressById,
  listAddresses,
  searchAddresses,
  updateAddress,
} from "../controllers/addressesController";
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import { UserRoles } from "../enums/userRolesEnum";
const router = express.Router();

router.use(authenticateToken);

router.get("/list", listAddresses);

router.get("/one/:id", getAddressById);

router.post(
  "/create",

  validateRequest(createAddressSchema),
  createAddress
);

router.post(
  "/update/:id",

  validateRequest(updateAddressSchema),
  updateAddress
);

router.post("/delete/:id", deleteAddress);

router.get(
  "/search",
  authorize([UserRoles.Admin, UserRoles.Seller]),
  searchAddresses
);

export default router;
