/**
 * @file Unit tests for Natural Language Processing (NLP) Task Parser.
 * These tests verify the extraction of task attributes (duration, energy, tags, dates)
 * from free-form text input.
 */
import { parseTaskInput } from '../utils/textParserUtils';

describe('NLP Task Parser', () => {

    /**
     * Test Case: Duration Extraction.
     * Verifies that 'm' (minutes) and 'h' (hours) tokens are correctly parsed.
     */
    it('should parse durations in minutes and hours', () => {
        const result = parseTaskInput("Check email 15m");
        expect(result.attributes.duration).toBe(15);
        expect(result.cleanTitle).toBe("Check email");

        const resultH = parseTaskInput("Deep work 1.5h");
        expect(resultH.attributes.duration).toBe(90);
    });

    /**
     * Test Case: Energy Level Extraction.
     * Verifies that '!' tokens are mapped to numeric energy values.
     */
    it('should parse energy levels', () => {
        const result = parseTaskInput("Gym session !high");
        expect(result.attributes.energy).toBe(90);
        expect(result.cleanTitle).toBe("Gym session");
    });

    /**
     * Test Case: Tag Extraction.
     * Verifies that '#' tokens are extracted as category tags.
     */
    it('should parse tags/categories', () => {
        const result = parseTaskInput("Fix bug #work");
        expect(result.attributes.category).toBe("work");
    });

    /**
     * Test Case: Multiple Attribute Extraction.
     * Verifies that multiple tokens can be parsed from a single string.
     */
    it('should parse multiple attributes at once', () => {
        const result = parseTaskInput("Yoga 30m !low @tomorrow #personal");
        expect(result.attributes.duration).toBe(30);
        expect(result.attributes.energy).toBe(20);
        expect(result.attributes.category).toBe("personal");
        expect(result.cleanTitle).toBe("Yoga");
    });
});
