import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Gemini AI proxy endpoint
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY chưa được cấu hình trên server. Vui lòng thêm khóa API trong cài đặt hoặc biến môi trường." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-2.5-flash or gemini-3.5-flash-lite or similar standard model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "Bạn là một trợ lý giáo viên tiểu học thông minh, chuyên nghiệp và ân cần trong ứng dụng GVCN SỐ.",
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Lỗi khi gọi dịch vụ AI" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
