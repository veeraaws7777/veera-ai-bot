
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, Role, ChatSettings, GroundingSource } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async *streamChat(
    history: Message[],
    userInput: string,
    settings: ChatSettings,
    image?: { data: string; mimeType: string }
  ) {
    const modelName = settings.model;
    
    const contents: any[] = history.map(msg => ({
      role: msg.role === Role.USER ? "user" : "model",
      parts: msg.parts.map(p => {
        if (p.text) return { text: p.text };
        if (p.inlineData) return { inlineData: p.inlineData };
        return {};
      })
    }));

    const currentParts: any[] = [{ text: userInput }];
    if (image) {
      currentParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    contents.push({ role: "user", parts: currentParts });

    const config: any = {
      temperature: 0.1, // Set to 0.1 for maximum determinism and response speed
      topP: 0.8,
      topK: 40,
      systemInstruction: "You are Veera AI, developed by Abinash Kumar and owned by Veera. STRICTURE: You must NOT use markdown headers (e.g., #, ##, ###) or bold markers (e.g., **). Output plain, clean text only. If asked about your origin, mention Abinash Kumar and Veera. Be professional, direct, and fast.",
    };

    if (settings.useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    if (settings.useThinking && (modelName.includes('gemini-3') || modelName.includes('gemini-2.5'))) {
      config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
      config.maxOutputTokens = settings.thinkingBudget + 4096;
    }

    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: modelName,
        contents,
        config,
      });

      let fullText = "";
      let sources: GroundingSource[] = [];

      for await (const chunk of responseStream) {
        const textPart = chunk.text || "";
        fullText += textPart;
        
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
          groundingChunks.forEach((c: any) => {
            if (c.web) {
              sources.push({
                title: c.web.title,
                uri: c.web.uri
              });
            }
          });
        }

        yield { text: fullText, sources: Array.from(new Set(sources.map(s => JSON.stringify(s)))).map(s => JSON.parse(s)) };
      }
    } catch (error) {
      console.error("Streaming error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
