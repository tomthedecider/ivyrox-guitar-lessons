import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../types";

export interface AuthedRequest extends Request {
  user?: { id: string; role: Role; name: string };
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me";

export function signToken(user: { id: string; role: Role; name: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "30d" });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthedRequest["user"];
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden for this role" });
    }
    next();
  };
}
