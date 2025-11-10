import { Router } from "express";
import { authenticateAdminToken } from "../middleware/authMiddleware";
import { GetCurrency, UpdateCurrency } from "../controllers/currencyController";

const router = Router();

router.post("/update", authenticateAdminToken, UpdateCurrency);

router.get("/get", authenticateAdminToken, GetCurrency);

export default router;
