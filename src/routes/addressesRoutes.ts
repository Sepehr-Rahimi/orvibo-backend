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
import {
  authenticateAdminToken,
  authenticateToken,
} from "../middleware/authMiddleware";
const router = express.Router();

router.get("/list", authenticateToken, listAddresses);

router.get("/one/:id", authenticateToken, getAddressById);

router.post(
  "/create",
  authenticateToken,
  validateRequest(createAddressSchema),
  createAddress
);

router.post(
  "/update/:id",
  authenticateToken,
  validateRequest(updateAddressSchema),
  updateAddress
);

router.post("/delete/:id", authenticateToken, deleteAddress);

router.get("/search", authenticateAdminToken, searchAddresses);

export default router;
