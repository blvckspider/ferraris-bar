import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken, REFRESH_SECRET } from "../utils/jwt.js";

const prisma = new PrismaClient();


// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await argon2.verify(user.passwordHash, password);
    if(!valid) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

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
    const payload = jwt.verify(token, REFRESH_SECRET) as { userId: number, role: string };
    const accessToken = generateAccessToken(payload.userId, payload.role);
    res.json({ accessToken });
  }
  catch{ res.status(401).json({ message: "Refresh token invalid" }); }
};

// Logout
export const logout = (req: Request, res: Response) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" || false,
    maxAge: 0,
  })
  .status(200).json({ message: "Logged out successfully" });
};