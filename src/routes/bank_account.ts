import { Router } from "express";
import { getAccount } from "../controllers/bankAccountController";

const router = Router();

router.get("/", getAccount);

export default router;
