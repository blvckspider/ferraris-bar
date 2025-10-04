import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// GET /products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    res.json(products);
  }
  catch(err){
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /products/:id
export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if(!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  }
  catch(err){
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /products
export const createProduct = async (req: Request, res: Response) => {
  const { name, price, available } = req.body;
  if(!name || typeof price !== "number") return res.status(400).json({ message: "Name and price are required" });

  try {
    const newProduct = await prisma.product.create({ data: { name, price, available: available ?? true } });
    res.status(201).json(newProduct);
  }
  catch(err){
    console.error("Error creating product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /products/:id
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, available } = req.body;

  try {
    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: { name, price, available },
    });
    res.json(updated);
  }
  catch(err){
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.product.delete({ where: { id: Number(id) } });
    res.status(204).send();
  }
  catch(err){
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Server error" });
  }
};
