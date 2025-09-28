import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

function isPrismaUniqueConstraintError(err: unknown): err is { code: "P2002" }{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof err === "object" && err !== null && "code" in err && (err as any).code === "P2002";
}


// Register
export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: "Email e password richieste" });

  try {
    const hash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: { email, passwordHash: hash },
    });

    res.status(201).json({ message: "Utente creato", userId: user.id });
  }
  catch(err: unknown){
    if(isPrismaUniqueConstraintError(err)){
      return res.status(400).json({ message: "Email già registrata" });
    }
    res.status(500).json({ message: "Errore server" });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: "Email e password richieste" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) return res.status(401).json({ message: "Credenziali errate" });

    const valid = await argon2.verify(user.passwordHash, password);
    if(!valid) return res.status(401).json({ message: "Credenziali errate" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ accessToken: token });
  }
  catch { res.status(500).json({ message: "Errore server" }); }
};