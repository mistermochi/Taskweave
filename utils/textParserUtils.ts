/**
 * Utility for parsing natural language strings into structured task data.
 * It uses regular expressions to extract attributes like duration, energy,
 * tags, and dates from a single line of text.
 */

/**
 * Result of the parsing operation.
 */
export interface ParsedTask {
    /** The task title with attribute tokens (like #work or 30m) removed. */
    cleanTitle: string;
    /** The extracted attributes. */
    attributes: {
        category?: string;
        duration?: number;
        energy?: number;
        assignedDate?: number;
        dueDate?: number;
    };
}

/**
 * Parses a natural language string into task attributes.
 *
 * @param input - The raw text input (e.g., "Email client #work 15m @today")
 * @returns A `ParsedTask` object containing the clean title and metadata.
 *
 * @example
 * parseTaskInput("Gym 60m !high") // { cleanTitle: "Gym", attributes: { duration: 60, energy: 90 } }
 */
export const parseTaskInput = (input: string): ParsedTask => {
    let cleanTitle = input.trim();
    const attributes: ParsedTask['attributes'] = {};

    // 1. Durations (e.g., 30m, 1h, 1.5h)
    const durationMatch = cleanTitle.match(/(?:^|\s)(\d+(?:\.\d+)?)(m|h)(?:\b|$)/i);
    if (durationMatch) {
        const val = parseFloat(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        attributes.duration = unit === 'h' ? val * 60 : val;
        cleanTitle = cleanTitle.replace(durationMatch[0], ' ');
    }

    // 2. Energy Levels (e.g., !high, !low, !med)
    const energyMatch = cleanTitle.match(/(?:^|\s)!(high|low|med|medium)(?:\b|$)/i);
    if (energyMatch) {
        const level = energyMatch[1].toLowerCase();
        if (level === 'high') attributes.energy = 90;
        else if (level === 'low') attributes.energy = 20;
        else attributes.energy = 50;
        cleanTitle = cleanTitle.replace(energyMatch[0], ' ');
    }

    // 3. Category/Tags (e.g., #work, #personal)
    const tagMatch = cleanTitle.match(/(?:^|\s)#([a-z0-9-]+)(?:\b|$)/i);
    if (tagMatch) {
        attributes.category = tagMatch[1].toLowerCase();
        cleanTitle = cleanTitle.replace(tagMatch[0], ' ');
    }

    // 4. Assigned Date (e.g., @today, @tomorrow, @mon)
    const dateMatch = cleanTitle.match(/(?:^|\s)@(today|tomorrow|mon|tue|wed|thu|fri|sat|sun)(?:\b|$)/i);
    if (dateMatch) {
        const keyword = dateMatch[1].toLowerCase();
        const d = new Date();
        if (keyword === 'tomorrow') d.setDate(d.getDate() + 1);
        // ... day of week logic ...
        d.setHours(12, 0, 0, 0);
        attributes.assignedDate = d.getTime();
        cleanTitle = cleanTitle.replace(dateMatch[0], ' ');
    }

    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
    return { cleanTitle, attributes };
};
