import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken, REFRESH_SECRET } from "../utils/jwt.js";

const prisma = new PrismaClient();
function isPrismaUniqueConstraintError(err: unknown): err is { code: "P2002" }{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof err === "object" && err !== null && "code" in err && (err as any).code === "P2002";
}


// Register
export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const hash = await argon2.hash(password);
    const user = await prisma.user.create({ data: { email, passwordHash: hash } });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res
      .cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "strict", secure: false }) // secure:true in prod
      .status(201)
      .json({ message: "Utente creato", userId: user.id, accessToken });
  }
  catch(err: unknown){
    if(isPrismaUniqueConstraintError(err)){
      return res.status(400).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await argon2.verify(user.passwordHash, password);
    if(!valid) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res
      .cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "strict", secure: false })
      .json({ accessToken });
  }
  catch { res.status(500).json({ message: "Server error" }); }
};

// Refresh token
export const refresh = (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if(!token) return res.status(401).json({ message: "Refresh token missing" });

  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as { userId: number };
    const accessToken = generateAccessToken(payload.userId);
    res.json({ accessToken });
  }
  catch { res.status(401).json({ message: "Refresh token invalid" }); }
};