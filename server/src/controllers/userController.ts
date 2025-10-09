import { Request, Response } from "express";
import { Prisma, PrismaClient, Role } from "../generated/prisma/index.js";
import argon2 from "argon2";
import { assertAuthenticated } from "../middleware/auth.js";

const prisma = new PrismaClient();
const privilegedRoles = ["DEV", "ADMIN"];

function isPrismaUniqueConstraintError(err: unknown): err is { code: "P2002" }{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof err === "object" && err !== null && "code" in err && (err as any).code === "P2002";
}


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

// POST /users
export const createUser = async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const { email, password, role } = req.body;
  const finalRole = role || "STUDENT";

  if(!email || !password) return res.status(400).json({ message: "Email and password required" });
  if(req.user.role === "ADMIN" && finalRole === "DEV")
    return res.status(403).json({ message: "Admins cannot assign DEV role" });

  try {
    const hash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: finalRole,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ message: "User created", userId: user.id });
  }
  catch(err: unknown){
    if(isPrismaUniqueConstraintError(err)) return res.status(400).json({ message: "Email already registered" });
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /users/:id
export const updateUser = async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const { id } = req.params;
  const { email, role }: { email?: string; role?: Role } = req.body;
  const userId = Number(id);
  
  if(isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });
  if(req.user.id !== userId && !privilegedRoles.includes(req.user.role))
    return res.status(403).json({ message: "Forbidden" });

  try {
    const data: Prisma.UserUpdateInput = {};

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if(!existingUser) return res.status(404).json({ message: "User not found" });
    if(req.user.role === "ADMIN" && existingUser.role === "DEV")
      return res.status(403).json({ message: "Admins cannot update a DEV user" });
    if(req.user.role === "ADMIN" && role === "DEV")
      return res.status(403).json({ message: "Admins cannot assign DEV role" });
    if(!email && !role) return res.status(400).json({ message: "No fields to update" });
    if(email) data.email = email;
    if(role) data.role = role;

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