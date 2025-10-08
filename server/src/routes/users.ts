import { Router } from "express";
import { getUsers, getUserById, updateUser, deleteUser } from "../controllers/userController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// protected
router.get("/", authenticate, requireRole(["DEV", "ADMIN"]), getUsers);
router.get("/:id", authenticate, getUserById);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, requireRole(["DEV", "ADMIN"]), deleteUser);

export default router;