import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { verifyIdToken } from "../../../lib/firebase-admin";

initializeDatabase();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  const decodedToken = await verifyIdToken(token);

  if (!decodedToken) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const { displayName, photoURL } = req.body;

    let user = await db.query.users.findFirst({
      where: eq(schema.users.firebaseUid, decodedToken.uid),
    });

    if (!user) {
      const now = new Date();
      const [newUser] = await db.insert(schema.users).values({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || "",
        displayName: displayName || null,
        photoUrl: photoURL || null,
        role: "user",
        credits: 100,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }).returning();
      user = newUser;
    } else {
      const now = new Date();
      await db.update(schema.users)
        .set({
          displayName: displayName || user.displayName,
          photoUrl: photoURL || user.photoUrl,
          updatedAt: now,
        })
        .where(eq(schema.users.id, user.id));

      user = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
