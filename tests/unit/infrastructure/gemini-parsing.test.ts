import { describe, it, expect } from 'vitest';

describe('Inline Duration Parsing Logic', () => {
    it('should extract duration from text', () => {
        // The regex we want to test (same as in service)
        const regex = /[\(\[]\s*(\d+)\s*(s|giây|sec|second)\s*[\)\]]/i;

        // Test cases
        const case1 = "Mèo đang ngủ (5s)".match(regex);
        expect(case1?.[1]).toBe('5');

        const case2 = "Cảnh đường phố [10s]".match(regex);
        expect(case2?.[1]).toBe('10');

        const case3 = "Nấu ăn ( 3 giây )".match(regex);
        expect(case3?.[1]).toBe('3');

        const case4 = "Không có thời lượng".match(regex);
        expect(case4).toBeNull();
    });
});
