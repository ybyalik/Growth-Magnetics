import type { NextApiRequest, NextApiResponse } from "next";
import { verifyIdToken } from "./firebase-admin";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  dbUser: typeof schema.users.$inferSelect;
}

export async function authenticateRequest(
  req: NextApiRequest
): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const decodedToken = await verifyIdToken(token);

  if (!decodedToken) {
    return null;
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.firebaseUid, decodedToken.uid),
  });

  if (!dbUser) {
    return null;
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    dbUser,
  };
}

export function requireAuth(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    user: AuthenticatedUser
  ) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await authenticateRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.dbUser.status === "suspended") {
      return res.status(403).json({ error: "Account suspended" });
    }

    return handler(req, res, user);
  };
}

export function requireAdmin(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    user: AuthenticatedUser
  ) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await authenticateRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.dbUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    return handler(req, res, user);
  };
}
