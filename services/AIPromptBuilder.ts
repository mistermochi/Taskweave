
import { TaskEntity } from '../types';

export class AIPromptBuilder {
    public static buildCalibrationPrompt(tasks: TaskEntity[], armNames: readonly string[]): string {
        const now = Date.now();
        const taskSummaries = tasks.map(t => {
            const ageDays = Math.floor((now - t.createdAt) / (1000 * 60 * 60 * 24));
            let deadlineInfo = "No Deadline";
            if (t.dueDate) {
                const hoursLeft = (t.dueDate - now) / (1000 * 60 * 60);
                if (hoursLeft < 0) deadlineInfo = "OVERDUE";
                else if (hoursLeft < 24) deadlineInfo = `Due in ${Math.floor(hoursLeft)}h`;
                else deadlineInfo = `Due in ${Math.floor(hoursLeft / 24)}d`;
            }
            return `- "${t.title}" [${t.category}, ${t.duration}m, ${t.energy}, ${deadlineInfo}, Age:${ageDays}d]`;
        }).slice(0, 25).join('\n');

        return `
            You are a productivity expert algorithm training a scheduling bandit.
            Available Strategies: ${JSON.stringify(armNames)}
            Real-World Mapping Rules:
            1. "The Crusher": MUST be selected if a task is OVERDUE or Due < 24h.
            2. "The Archaeologist": Select for tasks Age > 14d with "No Deadline".
            3. "Deep Flow": Morning hours (7-11), High Energy, Long tasks (>30m).
            4. "Twilight Ritual": Evening (19-23), Low Energy.
            5. "Momentum": When 'lastCategory' matches the chosen task's category.
            6. "Palette Cleanser": When 'lastCategory' is different (good for preventing burnout).
            7. "Quick Spark": High Energy but short duration (<20m).
            User's Actual Backlog:
            ${taskSummaries}
            Task: Generate 30 realistic scenarios covering the user's specific tasks.
            For each scenario:
            - Define a hypothetical Time (0-23) and Energy (0-100).
            - Optionally define a 'lastCategory' (Work, Personal, etc.) to simulate context switching.
            - Select the ONE best Strategy.
        `;
    }

    public static buildChatPrompt(context?: any): string {
        return `You are Taskweave, a minimalist AI life coach.
            Tone: Calm, supportive, zen, concise.
            Role: Help the user balance productivity with wellbeing.
            User Context: ${JSON.stringify(context || {}, null, 2)}
            Instructions:
            - Keep responses short (1-3 sentences) and conversational.
            - If the user is drained, suggest breaks or lighter tasks.
            - If the user is energized, encourage focus.
            - Do not use markdown formatting like bold or lists unless necessary for clarity.
        `;
    }
}
