/**
 * @file Unit tests for natural language task parsing.
 * Verifies the extraction of dates, durations, energy, and tags
 * from user-entered strings.
 */

import { parseTaskInput } from '../utils/textParserUtils';

describe('parseTaskInput', () => {
  it('should parse a complex string with multiple attributes', () => {
    // Mock the current date to ensure consistent test results for date parsing
    // Let's set it to March 1st, 2024
    const mockDate = new Date('2024-03-01T10:00:00Z');
    jest.useFakeTimers().setSystemTime(mockDate);

    const input = "Review PR #work !high ~30m today due 25Mar every month";
    const { cleanTitle, attributes } = parseTaskInput(input);

    // Expected assignedDate: March 1st, 2024 at 12:00:00
    const expectedAssignedDate = new Date('2024-03-01T12:00:00');

    // Expected dueDate: March 25th, 2024 at 23:59:59
    const expectedDueDate = new Date('2024-03-25T23:59:59.999');

    // Assertions
    expect(cleanTitle).toBe('Review PR');
    expect(attributes.tagKeyword).toBe('work');
    expect(attributes.energy).toBe('High');
    expect(attributes.duration).toBe(30);
    expect(attributes.assignedDate).toBe(expectedAssignedDate.getTime());
    expect(attributes.dueDate).toBe(expectedDueDate.getTime());
    expect(attributes.recurrence).toEqual({
      frequency: 'monthly',
      interval: 1,
    });

    // Clean up the mock
    jest.useRealTimers();
  });

  it('should parse a simple title with no attributes', () => {
    const input = "Just a simple task";
    const { cleanTitle, attributes } = parseTaskInput(input);
    expect(cleanTitle).toBe('Just a simple task');
    expect(Object.keys(attributes).length).toBe(0);
  });
});
