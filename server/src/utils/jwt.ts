import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
export const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";

export function generateAccessToken(id: number, role: string){
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(id: number, role: string) {
  return jwt.sign({ id, role }, REFRESH_SECRET, { expiresIn: "7d" });
}