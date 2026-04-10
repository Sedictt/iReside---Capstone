# Business Verification Test Page

## Overview

This is a temporary testing page for the business verification feature. It allows you to test the Valenzuela City Business Directory verification without going through the full landlord registration workflow.

## Access

Navigate to: `/admin/test-verification`

## Features

1. **Business Name Input**: Enter the business name you want to verify
2. **Business Address Input**: Optionally enter the business address for more accurate results
3. **Verify Business Button**: Triggers automated verification against the Valenzuela databank
4. **Manual Search Button**: Opens the official Valenzuela business databank website for manual verification
5. **Results Display**: Shows verification status, business details, and raw response data

## Testing Workflow

### Step 1: Enter Business Information
```
Business Name: [Required field]
Business Address: [Optional field]
```

### Step 2: Click "Verify Business"
The system will:
- Search the Valenzuela business databank
- Return verification results
- Display status (Verified, Not Found, or Error)

### Step 3: Review Results
The page will show:
- Verification status with icon
- Timestamp of verification
- Business details (if found)
- Error details (if failed)
- Raw response data for debugging

### Step 4: Manual Verification (Optional)
Click "Manual Search" to:
- Open the official Valenzuela business databank website
- Compare automated results with manual search
- Verify the automated verification is working correctly

## Test Cases

### Test Case 1: Known Business
```
Business Name: Jollibee
Business Address: (leave empty)
Expected: Should return "Verified" with business details
```

### Test Case 2: Business with Address
```
Business Name: SM Supermalls
Business Address: Valenzuela
Expected: Should return "Verified" with more specific results
```

### Test Case 3: Non-existent Business
```
Business Name: Fake Business 12345
Business Address: (leave empty)
Expected: Should return "Not Found"
```

### Test Case 4: Empty Business Name
```
Business Name: (leave empty)
Expected: Should show error "Business name is required"
```

## Understanding Results

### Status: Verified (Green)
- Business found in Valenzuela databank
- Shows business name, address, and other details
- Verification successful

### Status: Not Found (Yellow)
- Business not found in Valenzuela databank
- Could be:
  - Business doesn't exist
  - Business name spelling is incorrect
  - Business is registered under a different name
  - Business is not in Valenzuela City

### Status: Error (Red)
- Verification process failed
- Check error details for specific issue
- Common causes:
  - Website is down
  - Network issues
  - CORS blocking requests
  - Website structure changed

## Debugging

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check network requests in Network tab

### Check Server Logs
```bash
# If running locally, check terminal for server logs
# Look for errors from the verification API
```

### Compare with Manual Search
1. Click "Manual Search" button
2. Enter the same business name on the official website
3. Compare results
4. Note any discrepancies

## Current Limitations

The web scraping implementation is currently a **placeholder**. The actual HTML parsing logic needs to be implemented:

1. **Analyze the Website**: Open `https://bd.valenzuela.gov.ph/` and inspect the search form
2. **Implement HTML Parsing**: Use Cheerio to parse search results
3. **Handle JavaScript**: If needed, use Puppeteer for JavaScript-heavy sites

See `BUSINESS_VERIFICATION.md` for detailed implementation instructions.

## Next Steps After Testing

1. **Verify Basic Functionality**: Ensure the test page works
2. **Implement HTML Parsing**: Complete the web scraping logic
3. **Test with Real Businesses**: Verify against known Valenzuela businesses
4. **Integrate with Registration**: Use the feature in the actual registration workflow
5. **Remove Test Page**: Delete this page once feature is production-ready

## Files

- `src/app/admin/test-verification/page.tsx`: Test page UI
- `src/app/api/admin/registrations/test-verify/route.ts`: Test API endpoint
- `src/lib/business-verification.ts`: Verification utilities
- `docs/BUSINESS_VERIFICATION.md`: Full feature documentation

## Support

For issues:
1. Check browser console for errors
2. Review server logs
3. Compare with manual search results
4. See `BUSINESS_VERIFICATION.md` troubleshooting section
