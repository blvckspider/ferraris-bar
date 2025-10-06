import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../utils/jwt.js";
import { UserJWTPayload } from "../utils/express.js";
import jwt from "jsonwebtoken";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "Token missing or malformed" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserJWTPayload;
    req.user = payload;
    next();
  }
  catch { res.status(401).json({ message: "Token invalid or expired" }); }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if(!req.user) return res.status(401).json({ message: "Unauthorized" });
    if(!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
};