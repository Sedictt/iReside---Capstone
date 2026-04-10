import { describe, expect, it } from 'vitest';

import { assessBusinessMatch } from '@/lib/business-verification';

describe('assessBusinessMatch', () => {
    it('treats exact normalized names as strong matches', () => {
        const result = assessBusinessMatch('Jollibee Foods Corporation', 'JOLLIBEE FOODS CORPORATION');

        expect(result.isStrongMatch).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.score).toBeGreaterThanOrEqual(0.9);
    });

    it('uses address overlap to support otherwise similar names', () => {
        const result = assessBusinessMatch(
            'Mercury Drug',
            'Mercury Drug Store',
            'Maysan, Valenzuela City',
            'District 2, Maysan'
        );

        expect(result.isStrongMatch).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0.78);
    });

    it('rejects weak single-token overlaps that are likely false positives', () => {
        const result = assessBusinessMatch('ABC Realty', 'ABC Eatery and Catering');

        expect(result.isStrongMatch).toBe(false);
        expect(result.confidence).toBe('low');
        expect(result.score).toBeLessThan(0.78);
    });

    it('keeps medium-confidence matches manual when the address does not support them', () => {
        const result = assessBusinessMatch(
            'Prime Holdings',
            'Prime Holdings Services',
            'Malanday, Valenzuela',
            'Bagbaguin, Valenzuela'
        );

        expect(result.confidence).toBe('medium');
        expect(result.isStrongMatch).toBe(false);
    });
});
