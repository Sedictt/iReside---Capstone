import puppeteer from 'puppeteer';

export interface ScrapedBusinessRow {
    businessName: string;
    district: string;
    barangay: string;
    industry: string;
}

export interface ScrapedBusinessData {
    rows: ScrapedBusinessRow[];
}

/**
 * Real browser automation to search the Valenzuela Business Databank.
 * Returns ALL result rows exactly as the VLINK site shows them — no scoring or filtering.
 */
export async function scrapeValenzuelaBusinessDatabank(
    businessName: string,
    timeout: number = 60000
): Promise<ScrapedBusinessData> {
    let browser;

    try {
        console.log(`🔍 Starting scrape for: ${businessName}`);

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

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('🌐 Navigating to Valenzuela Business Databank...');

        // Try HTTPS first; if the site redirects and Puppeteer throws ERR_ABORTED,
        // we follow through and wait for the DataTables UI to appear instead.
        const TARGET_URL = 'https://bd.valenzuela.gov.ph/';

        const navigateTo = async (url: string, waitStrategy: 'load' | 'domcontentloaded' | 'networkidle0') => {
            try {
                await page.goto(url, { waitUntil: waitStrategy, timeout });
            } catch (navErr) {
                const msg = navErr instanceof Error ? navErr.message : String(navErr);
                if (msg.includes('ERR_ABORTED') || msg.includes('net::ERR_')) {
                    console.log(`⚠️ nav ${waitStrategy} aborted — checking page state...`);
                } else {
                    throw navErr;
                }
            }
        };

        // First attempt with 'load'
        await navigateTo(TARGET_URL, 'load');

        // Check if the page actually loaded the search form
        let pageReady = await page.evaluate(() => {
            return document.querySelector('input[placeholder*="business" i]') !== null
                || document.querySelector('table') !== null;
        });

        if (!pageReady) {
            console.log('⚠️ Page did not load properly, retrying with domcontentloaded...');
            await navigateTo(TARGET_URL, 'domcontentloaded');
            // Extra wait for JS to execute
            await new Promise(resolve => setTimeout(resolve, 3000));
            pageReady = await page.evaluate(() => {
                return document.querySelector('input[placeholder*="business" i]') !== null
                    || document.querySelector('table') !== null;
            });
        }

        const currentUrl = page.url();
        console.log(`🔗 Current URL: ${currentUrl}`);

        if (!pageReady) {
            throw new Error(`Page did not load expected content. URL: ${currentUrl}`);
        }

        // Wait for DataTables to finish initialising (loads the default dataset first)
        console.log('⏳ Waiting for DataTables to initialise...');
        try {
            await page.waitForFunction(
                () => (document.querySelector('table tbody tr td') as HTMLElement | null) !== null,
                { timeout: 20000 }
            );
        } catch {
            console.log('⚠️ DataTables did not populate — continuing anyway');
        }
        await new Promise(resolve => setTimeout(resolve, 800));


        // Fill the search input — use both Puppeteer typing and JS value assignment
        // to ensure the site's JavaScript framework picks up the value correctly.
        console.log('📝 Filling search form...');

        const inputFilled = await page.evaluate((name: string) => {
            const selectors = [
                'input[placeholder*="business" i]',
                'input[placeholder*="search" i]',
                'input[name="business_name"]',
                'input[name="search"]',
                'input[name="query"]',
                'input[type="text"]',
            ];
            for (const selector of selectors) {
                const input = document.querySelector(selector) as HTMLInputElement | null;
                if (input) {
                    input.focus();
                    // Clear existing value
                    input.value = '';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    // Set new value
                    input.value = name;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                    return selector;
                }
            }
            return null;
        }, businessName);

        if (inputFilled) {
            console.log(`✅ Filled search input via JS: ${inputFilled}`);
        } else {
            console.log('⚠️ Could not fill search input via JS evaluate');
        }

        // Short pause so the UI registers the value before we click search
        await new Promise(resolve => setTimeout(resolve, 500));

        // Click the search button
        // ─── Snapshot table state BEFORE clicking search ─────────────────────────
        // DataTables loads ALL businesses by default, so we must detect when the
        // table actually updates to show filtered results — not just that rows exist.
        const stateBeforeSearch = await page.evaluate(() => {
            const firstCell = document.querySelector('table tbody tr td');
            return firstCell?.textContent?.trim() ?? '__EMPTY__';
        });
        console.log(`📌 Table state before search: "${stateBeforeSearch}"`);

        // Click the search button
        console.log('🔘 Looking for search button...');
        let searchClicked = false;

        try {
            const buttonClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn, .btn'));
                const searchBtn = buttons.find(btn => {
                    const text = btn.textContent?.toLowerCase() || '';
                    return text.includes('search') || text.includes('find');
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

        if (!searchClicked) {
            for (const selector of ['.search-btn', 'button[type="submit"]', 'input[type="submit"]', '.btn-primary', 'button.btn']) {
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

        if (!searchClicked) {
            throw new Error('Could not find search button on the Valenzuela website.');
        }

        // ─── Wait for table to UPDATE ─────────────────────────────────────────────
        console.log('⏳ Waiting for table to update with filtered results...');

        try {
            await page.waitForFunction(
                (prevFirstCell: string) => {
                    const bodyText = document.body?.innerText?.toLowerCase() || '';
                    if (
                        bodyText.includes('no matching records found') ||
                        bodyText.includes('no data available in table')
                    ) {
                        return true; // Confirmed empty result
                    }
                    const firstCell = document.querySelector('table tbody tr td');
                    const currentText = firstCell?.textContent?.trim() ?? '';
                    // Accept if the first cell changed (filtered) OR if there are now 0 rows
                    return currentText !== prevFirstCell && currentText !== '';
                },
                { timeout: Math.min(timeout, 15000) },
                stateBeforeSearch
            );
            console.log('✅ Table updated after search');
        } catch {
            console.log('⚠️ waitForFunction timed out — scraping current state anyway');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Extract all rows
        console.log('🔍 Extracting table data...');
        const rows = await page.evaluate(() => {
            const result: { businessName: string; district: string; barangay: string; industry: string }[] = [];
            const tables = document.querySelectorAll('table');

            for (const table of tables) {
                for (const row of table.querySelectorAll('tbody tr')) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        const businessName = cells[0]?.textContent?.trim() || '';
                        const district = cells[1]?.textContent?.trim() || '';
                        const barangay = cells[2]?.textContent?.trim() || '';
                        const industry = cells[3]?.textContent?.trim() || '';

                        if (businessName && businessName !== 'Business Name' && businessName !== 'Name') {
                            result.push({ businessName, district, barangay, industry });
                        }
                    }
                }
            }

            return result;
        });

        console.log(`✅ Scraped ${rows.length} result rows`);
        return { rows };

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
