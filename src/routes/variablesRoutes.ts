import { Router } from "express";
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import {
  GetCurrency,
  getDollarToIrrExchange,
  UpdateCurrency,
} from "../controllers/variablesController";
import { UserRoles } from "../enums/userRolesEnum";

const router = Router();

router.get("/currency/get", GetCurrency);

router.get("/irrExchange/get", getDollarToIrrExchange);

router.use(authenticateToken);
router.use(authorize([UserRoles.Admin]));

router.post("/currency/update", UpdateCurrency);

export default router;
