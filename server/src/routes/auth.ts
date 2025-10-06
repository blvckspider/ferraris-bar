import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/authController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/register", authenticate, requireRole(["DEV", "ADMIN"]), register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;