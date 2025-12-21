import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, or } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const transactions = await db.query.transactions.findMany({
      where: or(
        eq(schema.transactions.fromUserId, user.dbUser.id),
        eq(schema.transactions.toUserId, user.dbUser.id)
      ),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });

    const enrichedTransactions = transactions.map((tx) => ({
      ...tx,
      direction: tx.toUserId === user.dbUser.id ? "received" : "given",
    }));

    return res.status(200).json({ transactions: enrichedTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
