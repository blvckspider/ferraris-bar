import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
export const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";

export function generateAccessToken(userId: number, role: string){
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, REFRESH_SECRET, { expiresIn: "7d" });
}