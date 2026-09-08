# Branded Windows installer publishing

Each iReside instance has a separate Vercel Blob store and publishes exactly one current Windows installer. The web deployment never compiles Electron. Vercel builds the Next.js application, while the Windows GitHub Actions runner packages the native installer.

## One-time setup per landlord instance

1. In that instance's Vercel project, create a Blob store and add its `BLOB_READ_WRITE_TOKEN` environment variable to Production, Preview, and Development.
2. Add the same token as a GitHub repository secret called `BLOB_READ_WRITE_TOKEN`.
3. To rebuild automatically when the landlord saves a new property name or logo, add these Vercel server-only variables: `GITHUB_DESKTOP_BUILD_REPOSITORY` (`owner/repository`) and `GITHUB_DESKTOP_BUILD_TOKEN` (a fine-grained GitHub token with **Actions: Read and write** for that repository). Optionally set `GITHUB_DESKTOP_BUILD_REF`; it defaults to `main`.
4. Deploy this change to Vercel. The `/api/desktop-release` route will return `404` until the first installer is published.

## Publish or refresh the installer

Open the repository's **Actions** tab, run **Publish branded Windows installer**, and supply the instance URL, for example `https://bryan-mark.example.com`.

The workflow runs on Windows, reads the live `/api/branding` endpoint, embeds the property name, domain, and logo, then replaces the instance's current installer in Blob. The `/download` page always asks `/api/desktop-release` for that release, so it never points at a stale shared `iReside-Setup` file.

Saving a new property name or logo queues this workflow automatically when the optional GitHub variables are configured. Otherwise, run it manually after changing either value. Application feature updates do not require rebuilding the installer because the desktop shell loads the tenant's deployed domain on launch.

## Why this is separate from Vercel

Electron Builder creates a Windows executable and NSIS installer. Vercel's Linux web-build workers are the wrong place to create and retain that binary. Keeping packaging in a Windows release workflow also prevents a large executable from being added to the Vercel deployment output.
