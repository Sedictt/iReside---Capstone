# Manual Verification Guide: Single-Use AES-256 Security Recovery Keys

This step-by-step document provides a manual testing protocol to verify that the Single-Use AES-256 Encrypted Security Recovery Key feature works as intended, complies with security constraints, and performs reliably.

---

## 1. System Overview & Architecture

- **Format**: 16-character Base32 formatted into 4 uppercase hyphenated chunks (`7K9P-4M2X-8W3Q-5H6J`). Ambiguous characters (`0`, `O`, `1`, `I`, `L`) are excluded.
- **Storage**: Encrypted at rest using AES-256-GCM with a 12-byte initialization vector (IV) and a 16-byte authentication tag in the `public.user_security_settings` table. Zero plaintext is stored.
- **Lifecycle**: Each key is **single-use**. Consuming a key during recovery invalidates it immediately and issues a fresh replacement key.
- **Brute-Force Protection**: 5 failed recovery attempts within a 15-minute window locks recovery for 15 minutes.
- **Protected Settings Rotation**: Requires re-entry of the current account password and a valid 6-digit email OTP.

---

## 2. Environment Prerequisites

1. Start the local development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000` in your browser.
3. Open Browser Developer Tools (`F12` or `Ctrl + Shift + I`) &rarr; **Console** and **Network** tabs to observe API responses.

---

## 3. Test Scenarios

### Test Suite 1: Initial Key Issuance & Storage Acknowledgment

#### Scenario 1A: Turnkey Setup Portal Launch (`/setup`)
1. Open an incognito window or navigate to: `http://localhost:3000/setup`
2. Fill in Step 1 (Branding & Colors), Step 2 (Rental Profile), and Step 3 (Master Admin Credentials).
   - Example Email: `admin-test@example.com`
   - Example Password: `Password123!`
3. Click **Initialize & Launch Portal**.
4. **Verification Points**:
   - [ ] On Step 4, the **Master Admin Security Recovery Key** card is displayed.
   - [ ] The key is initially masked with bullet points (`••••-••••-••••-••••`).
   - [ ] Click the **Eye** icon: verify the plaintext key is revealed. Click again to re-mask.
   - [ ] Click **Copy Key**: verify the toast appears (`"Security key copied to clipboard"`).
   - [ ] Click **Download (.txt)**: verify a file named `ireside-recovery-key-admin-test.txt` is downloaded.
   - [ ] Open the `.txt` file and verify it contains:
     - Account Email
     - Recovery Key
     - Generation Timestamp
     - Emergency recovery instructions
   - [ ] **Without checking the acknowledgment box**, click **Open Dashboard**:
     - Verify an error toast appears: *"Please confirm that you have saved your security recovery key before proceeding."*
     - Navigation is blocked.
   - [ ] Check the acknowledgment checkbox:
     - Verify the **Open Dashboard** button enables.
     - Click it and verify navigation to `/landlord/dashboard`.

#### Scenario 1B: First-Time Password Set (`/auth/reset-password`)
1. Navigate to: `http://localhost:3000/auth/reset-password`
2. Enter a new password and confirm password.
3. Click **Update Password**.
4. **Verification Points**:
   - [ ] The page transitions to display the **Security Recovery Key** card.
   - [ ] The **Continue to Dashboard** button is disabled until the acknowledgment checkbox is checked.
   - [ ] Once checked, clicking the button directs to the appropriate dashboard (`/tenant/dashboard` or `/landlord/dashboard`).

---

### Test Suite 2: Account Recovery via Security Key (`/forgot-password`)

#### Scenario 2A: Successful Account Recovery
1. Navigate to: `http://localhost:3000/forgot-password`
2. Select the **Security Recovery Key** tab at the top.
3. Fill out the form:
   - **Registered Email**: `admin-test@example.com`
   - **Security Recovery Key**: Paste the key saved from Scenario 1A (both formats work: with dashes `XXXX-XXXX-XXXX-XXXX` or without dashes).
   - **New Password**: `NewSecurePassword123!`
   - **Confirm Password**: `NewSecurePassword123!`
4. Click **Recover & Reset Credentials**.
5. **Verification Points**:
   - [ ] Success screen appears: *"Account Access Restored"*.
   - [ ] A **new single-use replacement security key** is displayed.
   - [ ] Warning informs the user that the previous key has been consumed and invalidated.
   - [ ] Download or copy the new key, check the acknowledgment box, and click **Continue to Login**.
   - [ ] Sign in at `/login` with `admin-test@example.com` and `NewSecurePassword123!`. Verify login succeeds.

#### Scenario 2B: Single-Use Invalidation Check (CRITICAL)
1. Go back to `http://localhost:3000/forgot-password` &rarr; **Security Recovery Key**.
2. Enter `admin-test@example.com` and the **original (consumed) security key** from Scenario 1A.
3. Enter another new password and submit.
4. **Verification Points**:
   - [ ] Request is rejected with the message: *"Invalid security recovery key or account not found."*
   - [ ] The password is **not** updated.
   - [ ] Confirms the used key was immediately invalidated.

#### Scenario 2C: Account Recovery with Lost Email Update
1. Navigate to `http://localhost:3000/forgot-password` &rarr; **Security Recovery Key**.
2. Enter `admin-test@example.com` and the **replacement security key** received from Scenario 2A.
3. Check the option: **"I lost access to my registered email address"**.
4. A new field appears: **New Email Address**.
   - Enter: `new-admin@example.com`
5. Enter a new password and submit.
6. **Verification Points**:
   - [ ] Recovery succeeds and generates a new replacement key.
   - [ ] Navigate to `/login`.
   - [ ] Verify you can log in with `new-admin@example.com` and the new password.
   - [ ] Attempting to log in with the old email fails.

---

### Test Suite 3: Brute-Force Rate Limiting & Lockout

1. Navigate to `http://localhost:3000/forgot-password` &rarr; **Security Recovery Key**.
2. Enter a valid email address and an intentionally invalid key (e.g. `AAAA-BBBB-CCCC-DDDD`).
3. Click **Recover & Reset Credentials** repeatedly.
4. **Verification Points**:
   - [ ] Attempts 1 through 4 fail with: *"Invalid security recovery key or account not found."*
   - [ ] On the **5th failed attempt**, the lockout triggers:
     *"Too many failed recovery attempts. Account recovery locked for 15 minutes."*
   - [ ] Subsequent attempts (even with the correct key) remain blocked until the 15-minute cooldown expires.

---

### Test Suite 4: Settings Key Management & Protected Rotation

#### Scenario 4A: Landlord Settings
1. Log in as a landlord and navigate to:
   `http://localhost:3000/landlord/settings?category=Security&subtab=Protection`
2. Inspect the **Security Recovery Key** management card:
   - [ ] Status badge displays **Active & Encrypted**.
   - [ ] Storage method shows **AES-256-GCM (Zero Plaintext)**.
   - [ ] Last Rotated timestamp is present.
3. Click **Rotate Recovery Key**:
   - [ ] Modal opens: *"Rotate Security Recovery Key"*.
   - [ ] Submitting without entering values is blocked by form validation.
   - [ ] Click **Send Code to Email**:
     - Toast confirms code dispatched.
     - Button enters a 60-second cooldown (`Resend in 59s...`).
   - [ ] Test wrong password + 6-digit code:
     - Rejection: *"Incorrect current password."*
   - [ ] Enter correct password + 6-digit verification code from email:
     - Click **Verify & Generate Key**.
     - Modal displays the newly generated replacement key card.
     - Download/copy the key, check acknowledgment, and click **Done & Close**.
   - [ ] The **Last Rotated** timestamp on the settings page updates to the current date.

#### Scenario 4B: Tenant Settings
1. Log in as a tenant and navigate to:
   `http://localhost:3000/tenant/settings?category=Security&subtab=Protection`
2. **Verification Points**:
   - [ ] The **Security Recovery Key** card is rendered above Two-Factor Authentication.
   - [ ] Displays active encrypted status and allows protected rotation following the identical password + OTP verification process.

---

### Test Suite 5: Database Zero-Plaintext Audit

1. Open your Supabase Dashboard or psql CLI.
2. Query `public.user_security_settings`:
   ```sql
   SELECT 
       profile_id,
       security_key_encrypted,
       security_key_iv,
       security_key_auth_tag,
       security_key_updated_at,
       security_key_failed_attempts,
       security_key_locked_until
   FROM public.user_security_settings;
   ```
3. **Verification Points**:
   - [ ] `security_key_encrypted` contains AES-256 ciphertext (Base64 string).
   - [ ] `security_key_iv` contains a 12-byte IV (Base64 string).
   - [ ] `security_key_auth_tag` contains a 16-byte authentication tag (Base64 string).
   - [ ] Plaintext recovery keys (`XXXX-XXXX-XXXX-XXXX`) are **never stored** in any database column or log.

---

## 4. Verification Sign-Off Checklist

| Test Item | Specification | Result |
| :--- | :--- | :---: |
| **Masking Toggle** | Eye button masks and unmasks plaintext key | Pass / Fail |
| **Clipboard Copy** | Copies key and triggers toast confirmation | Pass / Fail |
| **File Download** | `.txt` file contains formatted key, email, and instructions | Pass / Fail |
| **Onboarding Gate** | Cannot proceed to dashboard without checking acknowledgment | Pass / Fail |
| **Emergency Recovery** | Valid email + key successfully resets credentials | Pass / Fail |
| **Single-Use Invalidation** | Old key cannot be reused after recovery | Pass / Fail |
| **Lost Email Update** | User can update login email during key recovery | Pass / Fail |
| **Brute-Force Lockout** | 5 failed attempts locks out recovery for 15 minutes | Pass / Fail |
| **Protected Rotation** | Settings rotation strictly enforces password + OTP | Pass / Fail |
| **Tenant & Landlord Parity** | Available and functional in both Landlord & Tenant portals | Pass / Fail |
| **Zero Plaintext at Rest** | AES-256-GCM authenticated encryption at all times | Pass / Fail |
