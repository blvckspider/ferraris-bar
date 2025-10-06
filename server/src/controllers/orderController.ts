import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// GET /orders
export const getOrders = async (req: Request, res: Response) => {
  if(!req.user) return res.status(401).json({ message: "Unauthorized" });

  const privilegedRoles = ["DEV", "ADMIN", "BARTENDER"];
  const isPrivileged = privilegedRoles.includes(req.user.role);

  try {
    const orders = await prisma.order.findMany({
      where: isPrivileged ? {} : { userId: req.user.id },
      include: {
        user: { select: { id: true, email: true, role: true } },
        products: { include: { product: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(orders);
  }
  catch(err){res.status(500).json({ message: "Server error", error: err }) }
};

// GET /orders/:id
export const getOrderById = async (req: Request, res: Response) => {
  if(!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, email: true, role: true } },
        products: { include: { product: true } }
      }
    });

    if(!order) return res.status(404).json({ message: "Order not found" });

    const privilegedRoles = ["DEV", "ADMIN", "BARTENDER"];
    const isPrivileged = privilegedRoles.includes(req.user.role);

    if(!isPrivileged && order.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    res.json(order);
  }
  catch(err){ res.status(500).json({ message: "Server error", error: err }); }
};

// POST /orders
export const createOrder = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const products: { productId: number; quantity?: number }[] = req.body.products;
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Products array is required" });
  }

  try {
    const newOrder = await prisma.order.create({
      data: {
        userId: req.user.id,
        products: {
          create: products.map(p => ({
            productId: p.productId,
            quantity: p.quantity ?? 1
          }))
        }
      },
      include: { products: { include: { product: true } } }
    });

    res.status(201).json(newOrder);
  }
  catch(err){ res.status(500).json({ message: "Server error", error: err }) }
};

// PUT /orders/:id
export const updateOrder = async (req: Request, res: Response) => {
  if(!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  const products: { productId: number; quantity?: number }[] = req.body.products;

  if(!products || !Array.isArray(products) || products.length === 0){
    return res.status(400).json({ message: "Products array is required" });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if(!order) return res.status(404).json({ message: "Order not found" });

    const privilegedRoles = ["DEV", "ADMIN", "BARTENDER"];
    const isPrivileged = privilegedRoles.includes(req.user.role);
    if(!isPrivileged && order.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const existingProducts = await prisma.product.findMany({
      where: { id: { in: products.map(p => p.productId) } }
    });
    if(existingProducts.length !== products.length) return res.status(400).json({ message: "Some products do not exist" });

    await prisma.orderProduct.deleteMany({ where: { orderId: order.id } });
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        products: {
          create: products.map(p => ({
            productId: p.productId,
            quantity: p.quantity ?? 1
          }))
        }
      },
      include: {
        products: {
          include: { product: true }
        }
      }
    });

    res.json({
      id: updatedOrder.id,
      userId: updatedOrder.userId,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      products: updatedOrder.products.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        name: p.product.name,
        price: p.product.price
      }))
    });

  }
  catch(err){ res.status(500).json({ message: "Server error", error: err }); }
};

// DELETE /orders/:id
export const deleteOrder = async (req: Request, res: Response) => {
  if(!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if(!order) return res.status(404).json({ message: "Order not found" });
    if(order.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    await prisma.order.delete({ where: { id: order.id } });
    res.status(204).send();
  }
  catch(err){
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Server error" });
  }
};