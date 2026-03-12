
/**
 * Utility for parsing natural language strings into structured task data.
 * It uses regular expressions to extract attributes like duration, energy,
 * tags, and dates from a single line of text.
 */

import { EnergyLevel, RecurrenceConfig } from '@/entities/task';

/**
 * Result of the natural language parsing operation.
 */
export interface ParsedTaskInput {
    cleanTitle: string;
    attributes: {
        energy?: EnergyLevel;
        duration?: number;
        assignedDate?: number;
        dueDate?: number;
        recurrence?: RecurrenceConfig;
        tagKeyword?: string;
    };
}

// Hoisted constants to avoid re-allocation on every keystroke
const DAY_MAP: Record<string, number> = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6
};

const MONTH_MAP: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

// Pre-compiled regular expressions
const ENERGY_REGEX = /(?:^|\s)!(high|med|low|medium)(?:\b|$)/i;
const DURATION_REGEX = /(?:^|\s)(?:~)?(\d+)(m|h)(?:\b|$)/i;
const DUE_SLASH_REGEX = /(?:^|\s)due\s+(\d{1,2})\/(\d{1,2})(?:\b|$)/i;
const DUE_TEXT_REGEX = /(?:^|\s)due\s+(\d{1,2})(?:st|nd|rd|th)?\s?([a-z]{3,})(?:\b|$)/i;
const DUE_TODAY_REGEX = /(?:^|\s)due\s+(today|tod)(?:\b|$)/i;
const DUE_TOMORROW_REGEX = /(?:^|\s)due\s+(tomorrow|tom)(?:\b|$)/i;
const DUE_DAY_REGEX = /(?:^|\s)due\s+(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)(?:\b|$)/i;
const MULTI_DAY_RECURRENCE_REGEX = /(?:^|\s)every\s+((?:(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)[a-z]*\b(?:,?\s*(?:and\s*)?)?)+)(?:\b|$)/i;
const WEEKEND_RECURRENCE_REGEX = /(?:^|\s)every\s+weekend(?:\b|$)/i;
const WEEKDAY_RECURRENCE_REGEX = /(?:^|\s)every\s+weekday(?:\b|$)/i;
const GENERAL_RECURRENCE_REGEX = /(?:^|\s)(?:every\s+(\d+)?\s*)?(day|days|daily|week|weeks|weekly|month|months|monthly|year|years|yearly)(?:\b|$)/i;
const TAG_REGEX = /(?:^|\s)#(\w+)(?:\b|$)/gi;
const ASSIGN_SLASH_REGEX = /(?:^|\s)(?:@)?(\d{1,2})\/(\d{1,2})(?:\b|$)/i;
const ASSIGN_TEXT_REGEX = /(?:^|\s)(?:@)?(\d{1,2})(?:st|nd|rd|th)?\s?([a-z]{3,})(?:\b|$)/i;
const ASSIGN_TODAY_REGEX = /(?:^|\s)(?:@)?(today|tod)(?:\b|$)/i;
const ASSIGN_TOMORROW_REGEX = /(?:^|\s)(?:@)?(tomorrow|tom)(?:\b|$)/i;
const ASSIGN_NEXT_DAY_REGEX = /(?:^|\s)(?:@)?next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)(?:\b|$)/i;
const EXCESS_WHITESPACE_REGEX = /\s+/g;

/**
 * Helper: Resolve Date with Year Rollover
 */
const resolveDate = (day: number, monthIdx: number, type: 'due' | 'assigned') => {
    const now = new Date();
    const year = now.getFullYear();

    let d = new Date(year, monthIdx, day);

    // Reset time for accurate date comparison
    const todayStart = new Date(now);
    todayStart.setHours(0,0,0,0);

    // Rollover to next year if date is in the past (strictly before today)
    if (d < todayStart) {
        d.setFullYear(year + 1);
    }

    if (type === 'due') {
        d.setHours(23, 59, 59, 999);
    } else {
        d.setHours(12, 0, 0, 0);
    }
    return d.getTime();
};

/**
 * Helper: Get next occurrence of a specific day of week
 */
const getNextDayOfWeek = (dayIdx: number, type: 'due' | 'assigned' = 'assigned') => {
    const d = new Date();
    const currentDay = d.getDay();
    let diff = dayIdx - currentDay;
    // If it's today, we might want today if it's assigned, but for "every monday" usually implies starting this cycle
    if (diff < 0) diff += 7;

    d.setDate(d.getDate() + diff);
    if (type === 'due') {
        d.setHours(23, 59, 59, 999);
    } else {
        d.setHours(12, 0, 0, 0);
    }
    return d.getTime();
};

/**
 * Parses a natural language string into task attributes.
 *
 * @param text - The raw text input (e.g., "Email client #work ~15m @today")
 * @returns A `ParsedTaskInput` object containing the clean title and metadata.
 *
 * @example
 * parseTaskInput("Gym ~60m !high") // { cleanTitle: "Gym", attributes: { duration: 60, energy: 'High' } }
 */
export const parseTaskInput = (text: string): ParsedTaskInput => {
    let cleanTitle = text;
    const attributes: ParsedTaskInput['attributes'] = {};

    // 1. Energy (!high, !med, !low)
    const energyMatch = cleanTitle.match(ENERGY_REGEX);
    if (energyMatch) {
        const val = energyMatch[1].toLowerCase();
        attributes.energy = val.startsWith('h') ? 'High' : val.startsWith('l') ? 'Low' : 'Medium';
        cleanTitle = cleanTitle.replace(energyMatch[0], ' ');
    }

    // 2. Duration (30m, 1h, ~30m, ~1h)
    // Support optional '~' prefix for duration estimation
    const durationMatch = cleanTitle.match(DURATION_REGEX);
    if (durationMatch) {
        const num = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        attributes.duration = unit === 'h' ? num * 60 : num;
        cleanTitle = cleanTitle.replace(durationMatch[0], ' ');
    }

    // 3. Due Dates (Overrides recurrence initial date if specified later in string)
    const dueSlashMatch = cleanTitle.match(DUE_SLASH_REGEX);
    if (dueSlashMatch) {
        const day = parseInt(dueSlashMatch[1]);
        const month = parseInt(dueSlashMatch[2]) - 1;
        if (month >= 0 && month <= 11) {
            attributes.dueDate = resolveDate(day, month, 'due');
            cleanTitle = cleanTitle.replace(dueSlashMatch[0], ' ');
        }
    }

    if (!attributes.dueDate) {
        const dueTextMatch = cleanTitle.match(DUE_TEXT_REGEX);
        if (dueTextMatch) {
            const day = parseInt(dueTextMatch[1]);
            const monthStr = dueTextMatch[2].toLowerCase().substring(0, 3);
            if (MONTH_MAP[monthStr] !== undefined) {
                attributes.dueDate = resolveDate(day, MONTH_MAP[monthStr], 'due');
                cleanTitle = cleanTitle.replace(dueTextMatch[0], ' ');
            }
        }
    }

    if (!attributes.dueDate) {
        const dueTodayMatch = cleanTitle.match(DUE_TODAY_REGEX);
        if (dueTodayMatch) {
            const d = new Date();
            d.setHours(23, 59, 59, 999);
            attributes.dueDate = d.getTime();
            cleanTitle = cleanTitle.replace(dueTodayMatch[0], ' ');
        }
    }

    if (!attributes.dueDate) {
        const dueTomMatch = cleanTitle.match(DUE_TOMORROW_REGEX);
        if (dueTomMatch) {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(23, 59, 59, 999);
            attributes.dueDate = d.getTime();
            cleanTitle = cleanTitle.replace(dueTomMatch[0], ' ');
        }
    }

    if (!attributes.dueDate) {
        const dueDayMatch = cleanTitle.match(DUE_DAY_REGEX);
        if (dueDayMatch) {
            const dayStr = dueDayMatch[1].toLowerCase();
            let targetDay = DAY_MAP[dayStr];
            if (targetDay !== undefined) {
                attributes.dueDate = getNextDayOfWeek(targetDay, 'due');
                cleanTitle = cleanTitle.replace(dueDayMatch[0], ' ');
            }
        }
    }

    // 4. Recurrence Logic

    const multiDayMatch = cleanTitle.match(MULTI_DAY_RECURRENCE_REGEX);

    if (multiDayMatch) {
        const dayStr = multiDayMatch[1].toLowerCase();
        const foundDays = new Set<number>();
        Object.keys(DAY_MAP).forEach(key => {
            if (new RegExp(`\\b${key}\\b`).test(dayStr)) {
                foundDays.add(DAY_MAP[key]);
            }
        });

        if (foundDays.size > 0) {
            const sortedDays = Array.from(foundDays).sort();
            attributes.recurrence = {
                frequency: 'weekly',
                interval: 1,
                weekDays: sortedDays
            };

            if (!attributes.dueDate) {
                const today = new Date().getDay();
                let nextDay = sortedDays.find(d => d >= today);
                if (nextDay === undefined) nextDay = sortedDays[0];

                attributes.dueDate = getNextDayOfWeek(nextDay, 'due');
            }

            cleanTitle = cleanTitle.replace(multiDayMatch[0], ' ');
        }
    }

    // B. Special Aliases: "every weekend", "every weekday"
    if (!attributes.recurrence) {
        const weekendMatch = cleanTitle.match(WEEKEND_RECURRENCE_REGEX);
        if (weekendMatch) {
            attributes.recurrence = { frequency: 'weekly', interval: 1, weekDays: [0, 6] };
            if (!attributes.dueDate) {
                const today = new Date().getDay();
                const nextDay = (today === 0 || today === 6) ? today : 6;
                attributes.dueDate = getNextDayOfWeek(nextDay, 'due');
            }
            cleanTitle = cleanTitle.replace(weekendMatch[0], ' ');
        }

        const weekdayMatch = cleanTitle.match(WEEKDAY_RECURRENCE_REGEX);
        if (weekdayMatch) {
            attributes.recurrence = { frequency: 'weekly', interval: 1, weekDays: [1, 2, 3, 4, 5] };
            if (!attributes.dueDate) {
                const today = new Date().getDay();
                const nextDay = (today >= 1 && today <= 5) ? today : 1;
                attributes.dueDate = getNextDayOfWeek(nextDay, 'due');
            }
            cleanTitle = cleanTitle.replace(weekdayMatch[0], ' ');
        }
    }

    // C. General Frequency with Intervals: "every 2 weeks", "daily", "every month", "every 3 days"
    if (!attributes.recurrence) {
        const match = cleanTitle.match(GENERAL_RECURRENCE_REGEX);

        if (match) {
            const fullStr = match[0].trim();
            const intervalStr = match[1];
            const unit = match[2].toLowerCase();
            const isAlias = ['daily', 'weekly', 'monthly', 'yearly'].includes(unit);
            const hasEvery = fullStr.toLowerCase().startsWith('every');

            if (isAlias || hasEvery) {
                const interval = intervalStr ? parseInt(intervalStr) : 1;
                let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';

                if (unit.startsWith('week')) frequency = 'weekly';
                else if (unit.startsWith('month')) frequency = 'monthly';
                else if (unit.startsWith('year')) frequency = 'yearly';

                attributes.recurrence = { frequency, interval };

                if (!attributes.dueDate) {
                    const d = new Date();
                    d.setHours(23, 59, 59, 999);
                    attributes.dueDate = d.getTime();
                }

                cleanTitle = cleanTitle.replace(match[0], ' ');
            }
        }
    }

    // 5. Tags (#tagname)
    const tagMatches = Array.from(cleanTitle.matchAll(TAG_REGEX));
    if (tagMatches.length > 0) {
        tagMatches.forEach(m => {
            cleanTitle = cleanTitle.replace(m[0], ' ');
        });
        attributes.tagKeyword = tagMatches[tagMatches.length - 1][1].toLowerCase();
    }

    // 6. Assigned / Do Dates
    const assignSlashMatch = cleanTitle.match(ASSIGN_SLASH_REGEX);
    if (assignSlashMatch) {
        const day = parseInt(assignSlashMatch[1]);
        const month = parseInt(assignSlashMatch[2]) - 1;
        if (month >= 0 && month <= 11) {
            attributes.assignedDate = resolveDate(day, month, 'assigned');
            cleanTitle = cleanTitle.replace(assignSlashMatch[0], ' ');
        }
    }

    if (!attributes.assignedDate) {
        const assignTextMatch = cleanTitle.match(ASSIGN_TEXT_REGEX);
        if (assignTextMatch) {
            const day = parseInt(assignTextMatch[1]);
            const monthStr = assignTextMatch[2].toLowerCase().substring(0, 3);
            if (MONTH_MAP[monthStr] !== undefined) {
                attributes.assignedDate = resolveDate(day, MONTH_MAP[monthStr], 'assigned');
                cleanTitle = cleanTitle.replace(assignTextMatch[0], ' ');
            }
        }
    }

    if (!attributes.assignedDate) {
        const todayMatch = cleanTitle.match(ASSIGN_TODAY_REGEX);
        if (todayMatch) {
            const d = new Date();
            d.setHours(12, 0, 0, 0);
            attributes.assignedDate = d.getTime();
            cleanTitle = cleanTitle.replace(todayMatch[0], ' ');
        }
    }

    if (!attributes.assignedDate) {
        const tomMatch = cleanTitle.match(ASSIGN_TOMORROW_REGEX);
        if (tomMatch) {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(12, 0, 0, 0);
            attributes.assignedDate = d.getTime();
            cleanTitle = cleanTitle.replace(tomMatch[0], ' ');
        }
    }

    if (!attributes.assignedDate) {
        const nextDayMatch = cleanTitle.match(ASSIGN_NEXT_DAY_REGEX);
        if (nextDayMatch) {
            const dayStr = nextDayMatch[1].toLowerCase();
            let targetDay = DAY_MAP[dayStr];
            if (targetDay !== undefined) {
                attributes.assignedDate = getNextDayOfWeek(targetDay, 'assigned');
                cleanTitle = cleanTitle.replace(nextDayMatch[0], ' ');
            }
        }
    }

    cleanTitle = cleanTitle.replace(EXCESS_WHITESPACE_REGEX, ' ').trim();

    return { cleanTitle, attributes };
};
