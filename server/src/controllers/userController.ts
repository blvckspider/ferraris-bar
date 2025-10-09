import { Request, Response } from "express";
import { Prisma, PrismaClient, Role } from "../generated/prisma/index.js";
import argon2 from "argon2";
import { assertAuthenticated } from "../middleware/auth.js";
import { userSelect } from "../utils/types.js";

const prisma = new PrismaClient();
const privilegedRoles = ["DEV", "ADMIN"];

function isPrismaUniqueConstraintError(err: unknown): err is { code: "P2002" }{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof err === "object" && err !== null && "code" in err && (err as any).code === "P2002";
}


// GET /users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({ select: userSelect });
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
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
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
  const { email, password, role, name, surname, class: userClass } = req.body;
  const finalRole = role || "STUDENT";

  if(!email || !password) return res.status(400).json({ message: "Email and password required" });
  if(req.user.role === "ADMIN" && finalRole === "DEV")
    return res.status(403).json({ message: "Admins cannot assign DEV role" });

  try {
    const hash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: {
        name,
        surname,
        email,
        passwordHash: hash,
        role: finalRole,
        class: userClass
      },
      select: userSelect
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
  if(!req.body) return res.status(400).json({ message: "No data provided" });
  assertAuthenticated(req);
  const { id } = req.params;
  const { email, role, name, surname, class: userClass }: { 
    email?: string; 
    role?: Role; 
    name?: string; 
    surname?: string; 
    class?: string 
  } = req.body;
  const userId = Number(id);
  
  if(isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });
  
  if(role !== undefined && req.user.id === userId)
    return res.status(403).json({ message: "You cannot change your own role" });
  if(role !== undefined && !privilegedRoles.includes(req.user.role))
    return res.status(403).json({ message: "You are not allowed to change roles" });

  if(role === null) return res.status(400).json({ message: "Role cannot be null" });
  if(email === null) return res.status(400).json({ message: "Email cannot be null" });

  try {
    const data: Prisma.UserUpdateInput = {
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(name !== undefined && { name }),
      ...(surname !== undefined && { surname }),
      ...(userClass !== undefined && { class: userClass }),
    };
    if(Object.keys(data).length === 0)
      return res.status(400).json({ message: "No valid fields to update" });

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });

    if(!existingUser) return res.status(404).json({ message: "User not found" });
    if(req.user.role === "ADMIN" && existingUser.role === "DEV")
      return res.status(403).json({ message: "Admins cannot update a DEV user" });
    if(req.user.role === "ADMIN" && role === "DEV")
      return res.status(403).json({ message: "Admins cannot assign DEV role" });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect
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