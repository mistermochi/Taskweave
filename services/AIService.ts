import { GoogleGenAI, Type } from "@google/genai";
import { AIPredictionRequest, AIPredictionResponse, TaskEntity } from '@/types/scheduling';
import { AIPromptBuilder } from './AIPromptBuilder';
import { ARM_NAMES } from "./LinUCBService";

export class AIService {
    private ai: GoogleGenAI | null = null;
    private static instance: AIService;

    constructor() {
        try {
            if (process.env.API_KEY) {
                this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            } else {
                console.warn("API_KEY not found in environment variables.");
            }
        } catch (e) {
            console.warn("AI Service initialization failed", e);
        }
    }

    static getInstance(): AIService {
        if (!this.instance) this.instance = new AIService();
        return this.instance;
    }

    isAvailable(): boolean {
        return !!this.ai;
    }

    public async sendChatMessage(
        history: { role: 'user' | 'model'; text: string }[],
        message: string,
        context?: any
    ): Promise<string> {
        if (!this.ai) return "AI Service not available.";
        try {
            const systemInstruction = AIPromptBuilder.buildChatPrompt(context);
            const contents = history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            }));
            contents.push({ role: 'user', parts: [{ text: message }] });

            const result = await this.ai.models.generateContent({
                model: 'gemini-1.5-flash-preview',
                contents: contents,
                config: {
                    systemInstruction,
                    temperature: 0.7,
                }
            });

            return result.text || "...";
        } catch (e) {
            console.error("Chat Error", e);
            return "I'm having trouble connecting to the cloud right now.";
        }
    }

    async generateSuggestions(request: AIPredictionRequest): Promise<{ suggestions: AIPredictionResponse['suggestions']; confidence: number }> {
        // Placeholder for future scheduling implementation
        return { suggestions: [], confidence: 0 };
    }

    async getCalibrationData(tasks: TaskEntity[]): Promise<{ hour: number; energy: number; lastCategory?: string; strategy: string }[]> {
        if (!this.ai) throw new Error("AI Service not available");

        const systemInstruction = AIPromptBuilder.buildCalibrationPrompt(tasks, ARM_NAMES);
        const prompt = "Generate the training data JSON.";

        try {
            const result = await this.ai.models.generateContent({
                model: 'gemini-1.5-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                hour: { type: Type.INTEGER },
                                energy: { type: Type.INTEGER },
                                lastCategory: { type: Type.STRING, nullable: true },
                                strategy: { type: Type.STRING }
                            },
                            required: ["hour", "energy", "strategy"]
                        }
                    }
                }
            });

            if (result.text) {
                return JSON.parse(result.text);
            }
            return [];
        } catch (e) {
            console.error("Calibration AI Error", e);
            return [];
        }
    }

    getUsageStats() {
        return {
            requests: 0,
            totalTokens: 0,
            estimatedCost: 0
        };
    }

    resetUsageStats() {}
}
