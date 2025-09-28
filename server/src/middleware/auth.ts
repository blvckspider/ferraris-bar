import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: string | object;
}

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "Token missing or malformed" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  }
  catch { res.status(401).json({ message: "Token invalid or expired" }); }
};