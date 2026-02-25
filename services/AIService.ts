import { GoogleGenAI, Type } from "@google/genai";
import { AIPredictionRequest, AIPredictionResponse, TaskEntity } from '@/types/scheduling';
import { AIPromptBuilder } from './AIPromptBuilder';
import { ARM_NAMES } from "./LinUCBService";

/**
 * Service that interfaces with the Google Gemini AI models.
 * Used for generating synthetic training data, power-user scheduling assistance,
 * and conversational coaching.
 *
 * @singleton Use `AIService.getInstance()` to access the service.
 */
export class AIService {
    /** The initialized Google AI client. */
    private ai: GoogleGenAI | null = null;
    /** Singleton instance of the service. */
    private static instance: AIService;

    /**
     * Private constructor for singleton pattern.
     * Initializes the Gemini client using the API key from environment variables.
     */
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

    /**
     * Returns the singleton instance of AIService.
     * @returns The AIService instance.
     */
    static getInstance(): AIService {
        if (!this.instance) this.instance = new AIService();
        return this.instance;
    }

    /**
     * Checks if the AI service is properly configured and available for use.
     * @returns True if the client is initialized.
     */
    isAvailable(): boolean {
        return !!this.ai;
    }

    /**
     * Sends a chat message to the AI coach and retrieves a response.
     *
     * @param history - List of previous messages in the conversation.
     * @param message - The current user message.
     * @param context - Optional context about the user's state (tasks, energy, etc.).
     * @returns A promise resolving to the AI's response text.
     */
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

    /**
     * High-level scheduling suggestion logic (Placeholder).
     */
    async generateSuggestions(request: AIPredictionRequest): Promise<{ suggestions: AIPredictionResponse['suggestions']; confidence: number }> {
        // Placeholder for future scheduling implementation
        return { suggestions: [], confidence: 0 };
    }

    /**
     * Generates synthetic training data using the AI model.
     * This data is used to "warm-start" the machine learning model (LinUCB)
     * based on expert productivity heuristics.
     *
     * @param tasks - The user's actual task backlog to use as context for scenario generation.
     * @returns A promise resolving to an array of synthetic scenarios.
     */
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

    /**
     * Retrieves usage statistics for the AI service.
     */
    getUsageStats() {
        return {
            requests: 0,
            totalTokens: 0,
            estimatedCost: 0
        };
    }

    /**
     * Resets usage statistics.
     */
    resetUsageStats() {}
}
