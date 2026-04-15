import puppeteer from 'puppeteer';

export interface ScrapedBusinessData {
    businessName: string;
    address: string;
    owner?: string;
    permitNumber?: string;
    businessType?: string;
    registrationDate?: string;
    status?: string;
    rawText?: string;
    matchScore?: number;
    candidateCount?: number;
    candidates?: Array<{
        businessName: string;
        address: string;
        businessType?: string;
        matchScore?: number;
    }>;
}

function normalizeText(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(value: string): string[] {
    return normalizeText(value)
        .split(' ')
        .filter((token) => token.length > 1);
}

function overlapScore(left: string[], right: string[]): number {
    if (left.length === 0 || right.length === 0) return 0;

    const leftSet = new Set(left);
    const rightSet = new Set(right);
    const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
    const union = new Set([...leftSet, ...rightSet]).size;

    return union === 0 ? 0 : intersection / union;
}

function scoreCandidate(searchName: string, candidateName: string, searchAddress?: string, candidateAddress?: string): number {
    const normalizedSearch = normalizeText(searchName);
    const normalizedCandidate = normalizeText(candidateName);
    const exactScore = normalizedSearch === normalizedCandidate ? 1 : 0;
    const containsScore =
        normalizedSearch && normalizedCandidate &&
        (normalizedCandidate.includes(normalizedSearch) || normalizedSearch.includes(normalizedCandidate))
            ? 0.85
            : 0;
    const tokenScore = overlapScore(tokenize(searchName), tokenize(candidateName));
    const addressScore = searchAddress && candidateAddress ? overlapScore(tokenize(searchAddress), tokenize(candidateAddress)) : 0;

    return Number(Math.min(1, exactScore * 0.55 + containsScore * 0.25 + tokenScore * 0.15 + addressScore * 0.05).toFixed(3));
}

/**
 * Real browser automation to search Valenzuela Business Databank
 * Uses Puppeteer to interact with the actual website
 */
export async function scrapeValenzuelaBusinessDatabank(
    businessName: string,
    businessAddress?: string,
    timeout: number = 30000
): Promise<ScrapedBusinessData | null> {
    let browser;
    
    try {
        console.log(`🔍 Starting real scrape for: ${businessName}`);
        
        // Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
            ],
        });

        const page = await browser.newPage();
        
        // Set user agent to look like a real browser
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to the business databank
        console.log('🌐 Navigating to Valenzuela Business Databank...');
        await page.goto('https://bd.valenzuela.gov.ph/', {
            waitUntil: 'networkidle2',
            timeout: timeout,
        });
        
        // Wait for the page to load completely
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take screenshot for debugging (optional)
        // await page.screenshot({ path: 'debug-initial.png' });
        
        // Try to find and fill the search input
        console.log('📝 Filling search form...');
        
        // Common selectors for search inputs
        const searchInputSelectors = [
            'input[name="business_name"]',
            'input[name="search"]',
            'input[name="query"]',
            'input[name="keyword"]',
            'input[placeholder*="business" i]',
            'input[placeholder*="search" i]',
            '#search',
            '#business-search',
            '.search-input',
            'input[type="text"]',
        ];
        
        let searchInputFound = false;
        for (const selector of searchInputSelectors) {
            try {
                const input = await page.$(selector);
                if (input) {
                    await input.click();
                    await input.type(businessName, { delay: 100 });
                    console.log(`✅ Found search input: ${selector}`);
                    searchInputFound = true;
                    break;
                }
            } catch {
                continue;
            }
        }
        
        if (!searchInputFound) {
            console.log('⚠️ Could not find search input, trying JavaScript injection...');
            // Try to find any input and use it
            await page.evaluate((name) => {
                const inputs = document.querySelectorAll('input');
                for (const input of inputs) {
                    if (input.type === 'text' || input.type === 'search') {
                        (input as HTMLInputElement).value = name;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                }
                return false;
            }, businessName);
        }
        
        // If address provided, try to fill address field
        if (businessAddress) {
            const addressSelectors = [
                'input[name="address"]',
                'input[name="location"]',
                'input[placeholder*="address" i]',
                '#address',
            ];
            
            for (const selector of addressSelectors) {
                try {
                    const input = await page.$(selector);
                    if (input) {
                        await input.click();
                        await input.type(businessAddress, { delay: 50 });
                        console.log(`✅ Found address input: ${selector}`);
                        break;
                    }
                } catch {
                    continue;
                }
            }
        }
        
        // Find and click the search button - CRITICAL: Must click button, not press Enter
        console.log('🔘 Looking for search button...');
        
        let searchClicked = false;
        
        // Try 1: Look for button by text content using page.evaluate
        try {
            const buttonClicked = await page.evaluate(() => {
                // Find all buttons and look for one with "Search" text
                const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn, .btn'));
                const searchBtn = buttons.find(btn => {
                    const text = btn.textContent?.toLowerCase() || '';
                    return text.includes('search') || text.includes('find') || text.includes('🔍') || text.includes('magnify');
                });
                
                if (searchBtn) {
                    (searchBtn as HTMLElement).click();
                    return true;
                }
                return false;
            });
            
            if (buttonClicked) {
                console.log('✅ Clicked search button via text match');
                searchClicked = true;
            }
        } catch (e) {
            console.log('⚠️ Text-based button click failed:', e);
        }
        
        // Try 2: Common CSS selectors if text match didn't work
        if (!searchClicked) {
            const searchButtonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                '.btn-search',
                '#btn-search',
                '.search-btn',
                '[class*="search"]',
                'button.btn',
                '.btn-primary',
                // Based on screenshot - red/maroon button
                'button[style*="background"]',
                'button.red',
                'button.maroon',
            ];
            
            for (const selector of searchButtonSelectors) {
                try {
                    const button = await page.$(selector);
                    if (button) {
                        const isVisible = await button.evaluate(el => {
                            const style = window.getComputedStyle(el);
                            return style.display !== 'none' && style.visibility !== 'hidden';
                        });
                        
                        if (isVisible) {
                            await button.click();
                            console.log(`✅ Clicked search button: ${selector}`);
                            searchClicked = true;
                            break;
                        }
                    }
                } catch {
                    continue;
                }
            }
        }
        
        // Try 3: XPath as last resort
        if (!searchClicked) {
            try {
                const xpathClicked = await page.evaluate(() => {
                    // Try XPath to find button with search icon or text
                    const xpathResult = document.evaluate(
                        "//button[contains(., 'Search') or contains(., '🔍') or contains(@class, 'search')]",
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    );
                    const btn = xpathResult.singleNodeValue as HTMLElement;
                    if (btn) {
                        btn.click();
                        return true;
                    }
                    return false;
                });
                
                if (xpathClicked) {
                    console.log('✅ Clicked search button via XPath');
                    searchClicked = true;
                }
            } catch {
                console.log('⚠️ XPath button click failed');
            }
        }
        
        // If still no button found, this is an error - don't proceed
        if (!searchClicked) {
            throw new Error('Could not find search button - search cannot proceed without clicking the button');
        }
        
        // Wait for actual result rows or an explicit empty-state message, then fall back to a brief grace period.
        console.log('⏳ Waiting for results...');
        try {
            await page.waitForFunction(
                () => {
                    const rows = document.querySelectorAll('table tbody tr, table tr');
                    const bodyText = document.body?.innerText?.toLowerCase() || '';
                    return rows.length > 1 || bodyText.includes('no matching records found') || bodyText.includes('no data available');
                },
                { timeout: Math.min(timeout, 12000) }
            );
        } catch {
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
        
        // Take screenshot to debug
        try {
            await page.screenshot({ path: 'debug-after-search.png', fullPage: true });
            console.log('📸 Screenshot saved: debug-after-search.png');
        } catch {
            console.log('⚠️ Could not save screenshot');
        }
        
        // Check current URL and page info
        const currentUrl = page.url();
        console.log('🔗 Current URL:', currentUrl);
        
        const pageTitle = await page.title();
        console.log('📄 Page title:', pageTitle);
        
        // Check if page has search results
        const hasTable = await page.$('table');
        console.log('📊 Table found:', !!hasTable);
        
        const hasResults = await page.$('.dataTables_wrapper, .search-results, #DataTables_Table_0');
        console.log('🔍 Results container found:', !!hasResults);
        
        // Extract all table rows from the results table
        console.log('🔍 Extracting table data...');
        
        // DEBUG: Get raw HTML of first table
        const rawTableHtml = await page.evaluate(() => {
            const firstTable = document.querySelector('table');
            return firstTable ? firstTable.outerHTML.substring(0, 500) : 'No table found';
        });
        console.log('📝 Raw table HTML (first 500 chars):', rawTableHtml);
        
        const tableData = await page.evaluate(() => {
            const rows: { businessName: string; district: string; barangay: string; industry: string; fullText: string }[] = [];
            
            // Find the results table - look for table with business data
            const tables = document.querySelectorAll('table');
            console.log(`Found ${tables.length} tables on page`);
            
            for (let i = 0; i < tables.length; i++) {
                const table = tables[i];
                const tableRows = table.querySelectorAll('tbody tr, tr');
                console.log(`Table ${i}: ${tableRows.length} rows`);
                
                for (const row of tableRows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        // Based on the screenshot, columns are:
                        // 1: Business Name, 2: District, 3: Barangay, 4: Industry
                        const businessName = cells[0]?.textContent?.trim() || '';
                        const district = cells[1]?.textContent?.trim() || '';
                        const barangay = cells[2]?.textContent?.trim() || '';
                        const industry = cells[3]?.textContent?.trim() || '';
                        
                        if (businessName && 
                            businessName !== 'Business Name' && 
                            businessName !== 'Name' &&
                            !businessName.includes('Entries')) {
                            rows.push({
                                businessName,
                                district,
                                barangay,
                                industry,
                                fullText: row.textContent?.trim() || ''
                            });
                        }
                    }
                }
            }
            
            return rows;
        });
        
        console.log(`✅ Found ${tableData.length} businesses in table`);
        
        // DEBUG: Show first few results
        console.log('📋 First 3 results from table:');
        tableData.slice(0, 3).forEach((row, i) => {
            console.log(`  ${i + 1}. "${row.businessName}" | ${row.district} | ${row.barangay}`);
        });
        
        const rankedMatches = tableData
            .map((row) => ({
                ...row,
                matchScore: scoreCandidate(
                    businessName,
                    row.businessName,
                    businessAddress,
                    `${row.district}, ${row.barangay}`
                ),
            }))
            .sort((left, right) => right.matchScore - left.matchScore);

        const bestMatch = rankedMatches[0];

        if (bestMatch && bestMatch.matchScore >= 0.45) {
            console.log('✅ Best match found:', bestMatch.businessName);
            return {
                businessName: bestMatch.businessName,
                address: `${bestMatch.district}, ${bestMatch.barangay}`,
                owner: bestMatch.barangay, // Using barangay as location info
                permitNumber: undefined, // Not shown in table
                businessType: bestMatch.industry,
                rawText: bestMatch.fullText,
                matchScore: bestMatch.matchScore,
                candidateCount: rankedMatches.length,
                candidates: rankedMatches.slice(0, 5).map((candidate) => ({
                    businessName: candidate.businessName,
                    address: `${candidate.district}, ${candidate.barangay}`,
                    businessType: candidate.industry,
                    matchScore: candidate.matchScore,
                })),
            };
        }
        
        console.log('❌ No matching business found');
        return null;
        
    } catch (error) {
        console.error('❌ Error during scraping:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

/**
 * Quick test function to verify scraper works
 */
export async function testScraper(businessName: string = 'Jollibee'): Promise<void> {
    console.log('='.repeat(50));
    console.log('🧪 Testing Real Valenzuela Business Scraper');
    console.log('='.repeat(50));
    console.log(`\nSearching for: ${businessName}\n`);
    
    try {
        const result = await scrapeValenzuelaBusinessDatabank(businessName);
        
        if (result) {
            console.log('\n✅ SUCCESS - Real data found!');
            console.log('\nBusiness Details:');
            console.log(`  Name: ${result.businessName}`);
            console.log(`  Address: ${result.address}`);
            console.log(`  Owner: ${result.owner || 'N/A'}`);
            console.log(`  Permit: ${result.permitNumber || 'N/A'}`);
            console.log(`  Type: ${result.businessType || 'N/A'}`);
            if (result.rawText) {
                console.log(`\n  Raw Data: ${result.rawText.substring(0, 200)}...`);
            }
        } else {
            console.log('\n❌ No results found');
        }
    } catch (error) {
        console.error('\n❌ Error:', error);
    }
    
    console.log('\n' + '='.repeat(50));
}
