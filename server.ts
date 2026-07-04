import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // increase payload limit for base64 images
  app.use(express.json({ limit: '10mb' }));

  app.post("/api/parse-transaction", async (req, res) => {
    try {
      const { text, image } = req.body; // image can be base64 string

      if (!text && !image) {
        return res.status(400).json({ error: "Text or image is required" });
      }

      const parts: any[] = [];

      if (image) {
        // expect image to be "data:image/jpeg;base64,..."
        const mimeType = image.substring(image.indexOf(':') + 1, image.indexOf(';'));
        const base64Data = image.substring(image.indexOf(',') + 1);
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      parts.push({
        text: `You are a voice assistant for street vendors helping them record transactions. The user will describe a business income or expense (or upload a receipt), and you must parse it into structured JSON.
Rules:
- If the user describes selling or receiving money, or if it's a sales receipt, type is "sale".
- If the user describes buying, restocking, or spending money and it's not a direct sale, or if it's a purchase receipt, type is "expense".
- "quantity" defaults to 1.
- "sellingPricePerUnit": The selling price per unit. If they only said total revenue and quantity is 1, put the total here. (null if type is expense)
- "costPricePerUnit": The cost per unit, if mentioned. (null if not mentioned or if type is expense)
- "expenseAmount": The total expense amount. (null if type is sale)
- "item": Name of the item or purpose, short.
- "note": Brief notes, can be empty string.
${text ? `User input: ${text}` : `Extract from the provided image.`}`,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: parts,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: "Type of transaction",
                enum: ["sale", "expense"],
              },
              item: {
                type: Type.STRING,
                description: "Name of the item or purpose, short",
              },
              quantity: {
                type: Type.INTEGER,
                description: "Quantity of items, default 1",
              },
              sellingPricePerUnit: {
                type: Type.NUMBER,
                description: "Selling price per unit. Null if expense.",
                nullable: true,
              },
              costPricePerUnit: {
                type: Type.NUMBER,
                description: "Cost price per unit, if mentioned. Null if not mentioned or expense.",
                nullable: true,
              },
              expenseAmount: {
                type: Type.NUMBER,
                description: "Total expense amount. Null if sale.",
                nullable: true,
              },
              note: {
                type: Type.STRING,
                description: "Brief notes",
              },
            },
            required: ["type", "item", "quantity"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error) {
      console.error("Error parsing transaction:", error);
      res.status(500).json({ error: "Failed to parse transaction" });
    }
  });

  app.post("/api/generate-report", async (req, res) => {
    try {
      const { reportAgg } = req.body;
      if (!reportAgg) {
        return res.status(400).json({ error: "Report data is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an experienced, pragmatic, and friendly business consultant helping street vendors understand their monthly business data.
The user will give you a JSON summary of their business for the month (revenue, cost, net profit, and itemized data including quantity, revenue, cost, margin).
Write a short business analysis in English, kept under 300 words. Use the following structure (you must keep these "## " headings, and do not use other Markdown # symbols or ** bolding):

## Overall Performance
One or two sentences commenting on whether they made money this month and if the profit margin is healthy.

## Pricing & Cost Advice
For items with obviously low margin (<15%) or high margin, give specific actionable advice on pricing or negotiating, mentioning specific item names and numbers.

## 3 Things to Do Next Month
Use "- " to list 3 specific, actionable small suggestions (e.g., adjust a specific price, cut a certain cost, stock more/less of an item).

Tone: Like chatting with a stall owner, no rigid business jargon, speak simply.

Monthly Data:
${JSON.stringify(reportAgg, null, 2)}`,
              },
            ],
          },
        ],
      });

      res.json({ report: response.text });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
