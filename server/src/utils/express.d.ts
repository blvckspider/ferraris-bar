import { Role } from "../generated/prisma/index.js";

export interface UserJWTPayload {
  id: number;
  role: Role;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: UserJWTPayload;
  }
}