import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAdmin, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, adminUser: AuthenticatedUser) {
  if (req.method === "GET") {
    try {
      const users = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });

      return res.status(200).json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { userId, action, amount, reason } = req.body;

      if (!userId || !action) {
        return res.status(400).json({ error: "User ID and action are required" });
      }

      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const now = new Date();

      if (action === "add_credits") {
        const creditsToAdd = parseInt(amount) || 0;
        db.update(schema.users)
          .set({ 
            credits: user.credits + creditsToAdd,
            updatedAt: now,
          })
          .where(eq(schema.users.id, userId))
          .run();

        db.insert(schema.transactions).values({
          fromUserId: null,
          toUserId: userId,
          amount: creditsToAdd,
          type: "admin_add",
          referenceType: "manual",
          referenceId: null,
          description: reason || "Admin credit adjustment",
          createdAt: now,
        }).run();
      } else if (action === "remove_credits") {
        const creditsToRemove = parseInt(amount) || 0;
        const newCredits = Math.max(0, user.credits - creditsToRemove);
        db.update(schema.users)
          .set({ 
            credits: newCredits,
            updatedAt: now,
          })
          .where(eq(schema.users.id, userId))
          .run();

        db.insert(schema.transactions).values({
          fromUserId: userId,
          toUserId: null,
          amount: creditsToRemove,
          type: "admin_remove",
          referenceType: "manual",
          referenceId: null,
          description: reason || "Admin credit adjustment",
          createdAt: now,
        }).run();
      } else if (action === "make_admin") {
        db.update(schema.users)
          .set({ role: "admin", updatedAt: now })
          .where(eq(schema.users.id, userId))
          .run();
      } else if (action === "remove_admin") {
        db.update(schema.users)
          .set({ role: "user", updatedAt: now })
          .where(eq(schema.users.id, userId))
          .run();
      } else if (action === "suspend") {
        db.update(schema.users)
          .set({ status: "suspended", updatedAt: now })
          .where(eq(schema.users.id, userId))
          .run();
      } else if (action === "activate") {
        db.update(schema.users)
          .set({ status: "active", updatedAt: now })
          .where(eq(schema.users.id, userId))
          .run();
      }

      const updatedUser = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      return res.status(200).json({ user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireAdmin(handler);
