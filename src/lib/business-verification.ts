export interface BusinessVerificationResult {
    status: 'verified' | 'not_found' | 'error';
    data?: {
        businessName?: string;
        address?: string;
        owner?: string;
        permitNumber?: string;
        registrationDate?: string;
        businessType?: string;
        matchScore?: number;
        matchConfidence?: 'high' | 'medium' | 'low';
        matchedBy?: string;
        candidateCount?: number;
        candidates?: Array<{
            businessName: string;
            address?: string;
            matchScore?: number;
        }>;
        [key: string]: unknown;
    };
    error?: string;
    checkedAt: string;
    source: 'valenzuela_business_databank' | 'manual';
}

export interface ValenzuelaBusinessSearchResult {
    businessName: string;
    address: string;
    owner?: string;
    permitNumber?: string;
    [key: string]: unknown;
}

type CheerioSelection = {
    length: number;
    toArray(): unknown[];
    text(): string;
    find(selector: string): CheerioSelection;
};

type CheerioLoader = (selector: string | unknown) => CheerioSelection;
type CheerioLike = {
    load(html: string): CheerioLoader;
};

const VALENZUELA_BUSINESS_DATABANK_URL = 'https://bd.valenzuela.gov.ph/';
const BUSINESS_STOP_WORDS = new Set([
    'and',
    'branch',
    'business',
    'center',
    'centre',
    'co',
    'company',
    'corp',
    'corporation',
    'enterprise',
    'enterprises',
    'general',
    'inc',
    'incorporated',
    'international',
    'ltd',
    'limited',
    'llc',
    'marketing',
    'official',
    'phils',
    'philippines',
    'restaurant',
    'retail',
    'services',
    'shop',
    'store',
    'the',
    'trading',
]);

function normalizeText(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeBusinessText(value: string): string[] {
    return normalizeText(value)
        .split(' ')
        .filter((token) => token.length > 1 && !BUSINESS_STOP_WORDS.has(token));
}

function computeTokenOverlap(left: string[], right: string[]): number {
    if (left.length === 0 || right.length === 0) return 0;

    const leftSet = new Set(left);
    const rightSet = new Set(right);
    const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
    const union = new Set([...leftSet, ...rightSet]).size;

    return union === 0 ? 0 : intersection / union;
}

function computeContainmentScore(searchName: string, candidateName: string): number {
    const normalizedSearch = normalizeText(searchName);
    const normalizedCandidate = normalizeText(candidateName);

    if (!normalizedSearch || !normalizedCandidate) return 0;
    if (normalizedSearch === normalizedCandidate) return 1;
    if (normalizedCandidate.includes(normalizedSearch) || normalizedSearch.includes(normalizedCandidate)) return 0.84;

    return 0;
}

function computeAddressScore(searchAddress?: string, candidateAddress?: string): number {
    if (!searchAddress || !candidateAddress) return 0;

    return computeTokenOverlap(tokenizeBusinessText(searchAddress), tokenizeBusinessText(candidateAddress));
}

export function assessBusinessMatch(
    searchName: string,
    candidateName: string,
    searchAddress?: string,
    candidateAddress?: string
): {
    score: number;
    confidence: 'high' | 'medium' | 'low';
    matchedBy: string;
    isStrongMatch: boolean;
} {
    const normalizedSearch = normalizeText(searchName);
    const normalizedCandidate = normalizeText(candidateName);
    const tokenOverlap = computeTokenOverlap(tokenizeBusinessText(searchName), tokenizeBusinessText(candidateName));
    const containmentScore = computeContainmentScore(searchName, candidateName);
    const addressScore = computeAddressScore(searchAddress, candidateAddress);
    const startsWithBonus =
        normalizedSearch && normalizedCandidate && normalizedCandidate.startsWith(normalizedSearch) ? 0.05 : 0;
    const score = Math.min(1, containmentScore * 0.5 + tokenOverlap * 0.35 + addressScore * 0.1 + startsWithBonus);

    if (normalizedSearch === normalizedCandidate) {
        return {
            score: Number(score.toFixed(3)),
            confidence: 'high',
            matchedBy: 'exact normalized business name',
            isStrongMatch: true,
        };
    }

    if (score >= 0.9) {
        return {
            score: Number(score.toFixed(3)),
            confidence: 'high',
            matchedBy: addressScore >= 0.35 ? 'strong name + address overlap' : 'strong business name overlap',
            isStrongMatch: true,
        };
    }

    if (score >= 0.78) {
        return {
            score: Number(score.toFixed(3)),
            confidence: 'medium',
            matchedBy: addressScore >= 0.35 ? 'good name match with address support' : 'good business name overlap',
            isStrongMatch: searchAddress ? addressScore >= 0.2 : tokenOverlap >= 0.6,
        };
    }

    return {
        score: Number(score.toFixed(3)),
        confidence: 'low',
        matchedBy: 'weak token overlap',
        isStrongMatch: false,
    };
}

/**
 * Search the Valenzuela City Business Directory Databank for a business
 * Uses REAL browser automation with Puppeteer to interact with the actual website
 */
export async function searchValenzuelaBusinessDatabank(
    businessName: string,
    businessAddress?: string
): Promise<BusinessVerificationResult> {
    try {
        console.log(`🔍 Searching Valenzuela Business Databank for: ${businessName}`);
        
        // Import the real scraper
        const { scrapeValenzuelaBusinessDatabank } = await import('./valenzuela-scraper');
        
        // Use REAL browser automation to get actual data
        const scrapedData = await scrapeValenzuelaBusinessDatabank(businessName, businessAddress);

        if (scrapedData) {
            const matchAssessment = assessBusinessMatch(
                businessName,
                scrapedData.businessName,
                businessAddress,
                scrapedData.address
            );

            if (!matchAssessment.isStrongMatch) {
                console.warn('⚠️ Candidate found, but match was not strong enough for automatic verification');
                return {
                    status: 'not_found',
                    data: {
                        businessName: scrapedData.businessName,
                        address: scrapedData.address,
                        owner: scrapedData.owner,
                        permitNumber: scrapedData.permitNumber,
                        businessType: scrapedData.businessType,
                        registrationDate: scrapedData.registrationDate,
                        matchScore: matchAssessment.score,
                        matchConfidence: matchAssessment.confidence,
                        matchedBy: matchAssessment.matchedBy,
                        candidateCount: scrapedData.candidateCount,
                        candidates: scrapedData.candidates,
                    },
                    checkedAt: new Date().toISOString(),
                    source: 'valenzuela_business_databank',
                    error: 'Possible match found, but it was not strong enough to auto-verify. Please confirm manually.',
                };
            }

            console.log('✅ Real business data found!');
            return {
                status: 'verified',
                data: {
                    businessName: scrapedData.businessName,
                    address: scrapedData.address,
                    owner: scrapedData.owner,
                    permitNumber: scrapedData.permitNumber,
                    businessType: scrapedData.businessType,
                    registrationDate: scrapedData.registrationDate,
                    matchScore: matchAssessment.score,
                    matchConfidence: matchAssessment.confidence,
                    matchedBy: matchAssessment.matchedBy,
                    candidateCount: scrapedData.candidateCount,
                    candidates: scrapedData.candidates,
                },
                checkedAt: new Date().toISOString(),
                source: 'valenzuela_business_databank',
            };
        } else {
            console.log('❌ Business not found in Valenzuela records');
            return {
                status: 'not_found',
                checkedAt: new Date().toISOString(),
                source: 'valenzuela_business_databank',
                error: 'Business not found in Valenzuela City Business Directory',
            };
        }
    } catch (error) {
        console.error('❌ Error during real business verification:', error);
        
        // If real scraping fails, return error with details
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to verify business',
            checkedAt: new Date().toISOString(),
            source: 'valenzuela_business_databank',
        };
    }
}

/**
 * Parse HTML from Valenzuela business databank to extract business information
 * using cheerio for robust HTML parsing
 */
// Kept as a fallback parser for future non-browser scraping paths.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseBusinessDatabankHTMLWithCheerio(
    html: string, 
    searchBusinessName: string, 
    cheerio: CheerioLike
): ValenzuelaBusinessSearchResult | null {
    try {
        const $ = cheerio.load(html);
        const normalizedSearchName = searchBusinessName.toLowerCase().trim();
        
        // Try multiple common selectors for business listings
        const possibleSelectors = [
            '.business-item',
            '.business-listing',
            '.search-result',
            'tr[data-business]',
            '.business-card',
            '[class*="business"]',
            '[class*="result"]'
        ];
        
        let businessItems: unknown[] = [];
        
        // Find business items using various selectors
        for (const selector of possibleSelectors) {
            const items = $(selector);
            if (items.length > 0) {
                businessItems = items.toArray();
                break;
            }
        }
        
        // If no specific business items found, try to extract from table rows
        if (businessItems.length === 0) {
            const tableRows = $('table tr').toArray();
            if (tableRows.length > 1) {
                businessItems = tableRows.slice(1); // Skip header row
            }
        }
        
        // Search through business items for a match
        for (const item of businessItems) {
            const $item = $(item);
            
            // Extract business name from various possible selectors
            const businessNameSelectors = [
                '.business-name',
                '.name',
                'h3',
                'h4',
                'td:first-child',
                'td:nth-child(2)',
                '.title',
                '[class*="name"]',
                '[class*="title"]'
            ];
            
            let businessName = '';
            for (const selector of businessNameSelectors) {
                const text = $item.find(selector).text().trim();
                if (text) {
                    businessName = text;
                    break;
                }
            }
            
            // Check if this matches our search
            const normalizedBusinessName = businessName.toLowerCase();
            if (normalizedBusinessName.includes(normalizedSearchName) || 
                normalizedSearchName.includes(normalizedBusinessName)) {
                
                // Extract address
                const addressSelectors = [
                    '.address',
                    '.business-address',
                    'td:nth-child(3)',
                    'td:nth-child(4)',
                    '[class*="address"]'
                ];
                
                let address = '';
                for (const selector of addressSelectors) {
                    const text = $item.find(selector).text().trim();
                    if (text && text !== businessName) {
                        address = text;
                        break;
                    }
                }
                
                // Extract owner
                const ownerSelectors = [
                    '.owner',
                    '.business-owner',
                    'td:nth-child(2)',
                    '[class*="owner"]'
                ];
                
                let owner = '';
                for (const selector of ownerSelectors) {
                    const text = $item.find(selector).text().trim();
                    if (text && text !== businessName && text !== address) {
                        owner = text;
                        break;
                    }
                }
                
                // Extract permit number
                const permitSelectors = [
                    '.permit',
                    '.permit-number',
                    '.license',
                    'td:nth-child(5)',
                    '[class*="permit"]',
                    '[class*="license"]'
                ];
                
                let permitNumber = '';
                for (const selector of permitSelectors) {
                    const text = $item.find(selector).text().trim();
                    if (text && !text.includes(businessName)) {
                        permitNumber = text;
                        break;
                    }
                }
                
                return {
                    businessName: businessName,
                    address: address || 'Valenzuela City',
                    owner: owner || undefined,
                    permitNumber: permitNumber || undefined,
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing business databank HTML:', error);
        return null;
    }
}

/**
 * Generate a direct search URL for the Valenzuela business databank
 * This can be used as a fallback for manual verification
 */
export function generateValenzuelaSearchURL(businessName: string, businessAddress?: string): string {
    const params = new URLSearchParams({
        business_name: businessName,
        ...(businessAddress && { address: businessAddress }),
    });
    
    return `${VALENZUELA_BUSINESS_DATABANK_URL}?${params.toString()}`;
}

/**
 * Format verification result for display
 */
export function formatVerificationResult(result: BusinessVerificationResult): string {
    switch (result.status) {
        case 'verified':
            return `Business verified: ${result.data?.businessName || 'Unknown'} at ${result.data?.address || 'Unknown address'}`;
        case 'not_found':
            return 'Business not found in Valenzuela City Business Directory';
        case 'error':
            return `Verification error: ${result.error || 'Unknown error'}`;
        default:
            return 'Unknown verification status';
    }
}

/**
 * Check if verification is recent (within 30 days)
 */
export function isVerificationRecent(checkedAt: string): boolean {
    const checkedDate = new Date(checkedAt);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return checkedDate > thirtyDaysAgo;
}
