import { Request, Response } from "express";
import { Prisma, PrismaClient } from "../generated/prisma/index.js";
import argon2 from "argon2";
import { assertAuthenticated } from "../middleware/auth.js";

const prisma = new PrismaClient();
const privilegedRoles = ["DEV", "ADMIN"];

// GET /users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true, updatedAt: true } });
    res.json(users);
  }
  catch(err){ res.status(500).json({ message: "Server error", error: err }); }
};

// GET /users/:id
export const getUserById = async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const { id } = req.params;
  const userId = Number(id);
  
  if(isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true }
    });
    if(!user) return res.status(404).json({ message: "User not found" });

    if(req.user.id !== userId && !privilegedRoles.includes(req.user.role)){
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(user);
  }
  catch(err){ res.status(500).json({ message: "Server error", error: err }); }
};

// PUT /users/:id
export const updateUser = async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const { id } = req.params;
  const { email, password }: { email?: string; password?: string } = req.body;
  const userId = Number(id);
  
  if(isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });
  if(req.user.id !== userId && !privilegedRoles.includes(req.user.role)){
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const data: Prisma.UserUpdateInput = {};
    if(!email && !password) return res.status(400).json({ message: "No fields to update" });
    if(email) data.email = email;
    if(password) data.passwordHash = await argon2.hash(password);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, role: true, updatedAt: true }
    });
    res.json(updatedUser);
  }
  catch(err){ res.status(500).json({ message: "Server error", error: err }); }
};

// DELETE /users/:id
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = Number(id);
  if(isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

  try {
    await prisma.user.delete({ where: { id: userId } });
    res.status(204).send();
  }
  catch(err){ res.status(500).json({ message: "Server error", error: err }); }
};