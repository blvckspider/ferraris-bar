import { Router } from "express";
import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder } from "../controllers/orderController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderById);
router.post("/", authenticate, createOrder);

router.put("/:id", authenticate, requireRole(["DEV", "ADMIN"]), updateOrder);
router.delete("/:id", authenticate, requireRole(["DEV", "ADMIN"]), deleteOrder);

export default router;