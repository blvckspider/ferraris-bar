import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
export const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";

export function generateAccessToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: number) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
}