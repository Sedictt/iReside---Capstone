import type { ScrapedBusinessRow } from './valenzuela-scraper';

export interface BusinessVerificationResult {
    status: 'found' | 'not_found' | 'error';
    rows: ScrapedBusinessRow[];
    error?: string;
    checkedAt: string;
    source: 'valenzuela_business_databank';
}

const VALENZUELA_BUSINESS_DATABANK_URL = 'https://bd.valenzuela.gov.ph/';

/**
 * Search the Valenzuela City Business Directory Databank for a business.
 * Returns all matching rows exactly as the VLINK site shows them.
 * The admin sees the results and decides — no auto-matching.
 */
export async function searchValenzuelaBusinessDatabank(
    businessName: string,
): Promise<BusinessVerificationResult> {
    try {
        console.log(`🔍 Searching Valenzuela Business Databank for: ${businessName}`);

        const { scrapeValenzuelaBusinessDatabank } = await import('./valenzuela-scraper');
        const { rows } = await scrapeValenzuelaBusinessDatabank(businessName);

        if (rows.length > 0) {
            console.log(`✅ Found ${rows.length} results`);
            return {
                status: 'found',
                rows,
                checkedAt: new Date().toISOString(),
                source: 'valenzuela_business_databank',
            };
        } else {
            console.log('❌ No results found');
            return {
                status: 'not_found',
                rows: [],
                checkedAt: new Date().toISOString(),
                source: 'valenzuela_business_databank',
                error: 'No businesses found matching that name in the Valenzuela City Business Directory.',
            };
        }
    } catch (error) {
        console.error('❌ Error during business verification:', error);
        return {
            status: 'error',
            rows: [],
            error: error instanceof Error ? error.message : 'Failed to connect to Valenzuela Business Directory.',
            checkedAt: new Date().toISOString(),
            source: 'valenzuela_business_databank',
        };
    }
}

/**
 * Generate a direct search URL for manual verification fallback.
 */
export function generateValenzuelaSearchURL(businessName: string): string {
    const params = new URLSearchParams({ business_name: businessName });
    return `${VALENZUELA_BUSINESS_DATABANK_URL}?${params.toString()}`;
}
