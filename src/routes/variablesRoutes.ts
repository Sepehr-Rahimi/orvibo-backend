import { Router } from "express";
import { authenticateAdminToken } from "../middleware/authMiddleware";
import {
  GetCurrency,
  getDollarToIrrExchange,
  UpdateCurrency,
} from "../controllers/variablesController";

const router = Router();

router.post("/currency/update", authenticateAdminToken, UpdateCurrency);

router.get("/currency/get", GetCurrency);

router.get("/irrExchange/get", getDollarToIrrExchange);

export default router;
