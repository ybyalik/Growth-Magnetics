import type { NextApiRequest, NextApiResponse } from "next";
import { fetchCategories, buildCategoryTree } from "../../../lib/dataforseo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const categories = await fetchCategories();
    const tree = buildCategoryTree(categories);
    
    return res.status(200).json({ 
      categories,
      tree,
      count: categories.length 
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
