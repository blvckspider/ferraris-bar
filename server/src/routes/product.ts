import { Router } from "express";
import { getProducts, getProductById,  createProduct, updateProduct, deleteProduct } from "../controllers/productController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// public
router.get("/", getProducts);
router.get("/:id", getProductById);

// protected
router.post("/", authenticate, requireRole(["ADMIN", "BARTENDER"]), createProduct);
router.put("/:id", authenticate, requireRole(["ADMIN", "BARTENDER"]), updateProduct);
router.delete("/:id", authenticate, requireRole(["ADMIN"]), deleteProduct);

export default router;