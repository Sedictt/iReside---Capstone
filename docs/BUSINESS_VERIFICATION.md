# Business Verification Feature

## Overview

This feature adds automated business verification capability to the landlord registration workflow, allowing admins to verify landlord businesses against the Valenzuela City Business Directory Databank without relying on external stakeholders like BLPO or barangay officials.

## Architecture

### Database Changes

The `landlord_applications` table now includes:
- `business_name`: Business name to verify
- `business_address`: Business address for verification
- `verification_status`: Status of verification (not_verified, verified, not_found, error)
- `verification_data`: JSON data from verification source
- `verification_checked_at`: Timestamp of last verification
- `verification_notes`: Admin notes about verification results

### Components

1. **Backend API Route** (`/api/admin/registrations/[id]/verify`)
   - POST: Initiates business verification
   - GET: Retrieves verification status and manual search URL

2. **Verification Utility** (`src/lib/business-verification.ts`)
   - `searchValenzuelaBusinessDatabank()`: Searches the Valenzuela business databank
   - `generateValenzuelaSearchURL()`: Creates manual search URL for fallback
   - `formatVerificationResult()`: Formats verification results for display

3. **Admin UI** (`src/app/admin/registrations/page.tsx`)
   - Business verification section in registration review
   - Input fields for business name and address
   - "Verify Business" button for automated verification
   - "Manual Search" button for fallback to official website
   - Display of verification status and results

## Usage

### For Admins

1. Navigate to **Admin > Registrations**
2. Open a landlord registration for review
3. In the **Business Verification** section:
   - Enter the business name (required)
   - Optionally enter the business address
   - Click **Verify Business** to run automated verification
   - Or click **Manual Search** to open the Valenzuela business databank website
4. Review verification results:
   - **Verified**: Business found in databank with details
   - **Not Found**: Business not found in databank
   - **Error**: Verification failed (check notes for details)
5. Use verification results alongside document review to make approval decisions

### Verification Workflow

```
Landlord Registration
        |
        v
Admin enters business name/address
        |
        v
Click "Verify Business"
        |
        v
System searches Valenzuela business databank
        |
        +---> Success: Display business details
        |
        +---> Not Found: Show "Not Found" status
        |
        +---> Error: Show error message
        |
        v
Admin can use "Manual Search" as fallback
        |
        v
Admin makes approval decision
```

## Implementation Notes

### Web Scraping Approach

Since the Valenzuela business databank doesn't provide a public API, this implementation uses a web scraping workaround:

1. **Current Implementation**: Placeholder structure for web scraping
2. **Required Enhancement**: Actual HTML parsing logic needed
3. **Recommended Tools**:
   - **Puppeteer** or **Playwright**: For JavaScript-heavy sites
   - **Cheerio**: For HTML parsing
   - **Proxy Server**: To handle CORS issues

### To Complete the Web Scraping Implementation

1. **Analyze the Website**:
   ```bash
   # Open browser dev tools on https://bd.valenzuela.gov.ph/
   # Monitor network requests when searching
   # Identify form submission endpoint and parameters
   ```

2. **Implement HTML Parsing**:
   ```typescript
   // In src/lib/business-verification.ts
   import * as cheerio from 'cheerio';
   
   function parseBusinessDatabankHTML(html: string, searchBusinessName: string): ValenzuelaBusinessSearchResult | null {
       const $ = cheerio.load(html);
       
       // Extract business information from search results
       const businessName = $('.business-name').first().text().trim();
       const address = $('.business-address').first().text().trim();
       const owner = $('.business-owner').first().text().trim();
       const permitNumber = $('.permit-number').first().text().trim();
       
       if (businessName && businessName.toLowerCase().includes(searchBusinessName.toLowerCase())) {
           return { businessName, address, owner, permitNumber };
       }
       
       return null;
   }
   ```

3. **Handle JavaScript-Heavy Sites**:
   ```typescript
   // If the site requires JavaScript for search
   import puppeteer from 'puppeteer';
   
   async function searchValenzuelaBusinessDatabank(businessName: string, businessAddress?: string) {
       const browser = await puppeteer.launch();
       const page = await browser.newPage();
       
       await page.goto('https://bd.valenzuela.gov.ph/');
       
       // Fill in search form
       await page.type('#business-name-input', businessName);
       if (businessAddress) {
           await page.type('#address-input', businessAddress);
       }
       
       // Submit form
       await page.click('#search-button');
       await page.waitForSelector('.search-results');
       
       // Extract results
       const results = await page.evaluate(() => {
           const items = document.querySelectorAll('.business-item');
           return Array.from(items).map(item => ({
               businessName: item.querySelector('.business-name')?.textContent,
               address: item.querySelector('.address')?.textContent,
           }));
       });
       
       await browser.close();
       return results;
   }
   ```

### Rate Limiting and Caching

To avoid overwhelming the external website:

1. **Implement Rate Limiting**:
   ```typescript
   const VERIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes
   
   async function searchValenzuelaBusinessDatabank(businessName: string, businessAddress?: string) {
       const lastVerification = await getLastVerificationTime(businessName);
       const now = Date.now();
       
       if (lastVerification && now - lastVerification < VERIFICATION_COOLDOWN) {
           throw new Error('Please wait before verifying again');
       }
       // ... rest of implementation
   }
   ```

2. **Cache Results**:
   ```typescript
   // Store verification results in database
   // Reuse cached results if they're recent (e.g., within 30 days)
   ```

## Security Considerations

1. **Input Validation**: Always sanitize business names and addresses
2. **Error Handling**: Never expose detailed error messages to users
3. **Rate Limiting**: Protect against abuse of the verification endpoint
4. **CORS**: Handle cross-origin requests properly
5. **Data Privacy**: Don't store sensitive business information unnecessarily

## Future Enhancements

1. **Multiple Verification Sources**: Add support for other business registries
2. **Batch Verification**: Verify multiple registrations at once
3. **Verification History**: Track all verification attempts
4. **Auto-Approval Rules**: Automatically approve registrations with verified businesses
5. **Verification Alerts**: Notify admins when verification fails
6. **Document Matching**: Compare uploaded documents with verification results

## Troubleshooting

### Verification Always Returns "Not Found"

- Check if the business name is entered correctly
- Try variations of the business name
- Use manual search to verify the business exists in the databank
- Check if the website structure has changed

### Verification Returns "Error"

- Check browser console for detailed error messages
- Verify the website is accessible
- Check if CORS is blocking requests
- Review server logs for more details

### Manual Search Doesn't Work

- Verify the manual search URL is generated correctly
- Check if the Valenzuela business databank website is online
- Try opening the URL manually in a browser

## Testing

To test the verification workflow:

1. Create a test landlord registration
2. Enter a known business name from Valenzuela
3. Click "Verify Business"
4. Check if verification results appear correctly
5. Test with businesses that don't exist
6. Test manual search fallback
7. Verify database stores verification data correctly

## Dependencies

- Next.js API routes
- Supabase (database)
- Cheerio (for HTML parsing - to be added)
- Puppeteer/Playwright (for JavaScript-heavy sites - optional)

## Related Files

- `supabase/migrations/20260408_business_verification.sql`: Database schema
- `src/lib/business-verification.ts`: Verification utilities
- `src/app/api/admin/registrations/[id]/verify/route.ts`: API endpoint
- `src/app/admin/registrations/page.tsx`: Admin UI

## Support

For issues or questions about the business verification feature:
1. Check this documentation
2. Review the code comments in implementation files
3. Check server logs for detailed error messages
4. Test with manual search as fallback
