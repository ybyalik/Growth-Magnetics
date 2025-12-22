import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeWebsite(domain: string): Promise<string | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a website summarizer for an SEO marketplace. Provide a concise, one-sentence summary of what the website does. DO NOT mention the website's name, brand name, or domain. Use generic terms like 'this platform', 'the site', or 'this website'. Focus on the industry, service, and value proposition.",
        },
        {
          role: "user",
          content: `Summarize this website based on its domain: ${domain}`,
        },
      ],
      max_tokens: 60,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Error summarizing website:", error);
    return null;
  }
}
