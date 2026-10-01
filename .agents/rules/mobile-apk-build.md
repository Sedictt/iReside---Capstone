---
trigger: always_on
---

# Android APK Build Protocol

When building, updating, or maintaining the iReside Android mobile application:

1. **Directory Isolation**: Keep all native Android source code, Gradle configurations, and Android manifests isolated inside `android/` and automated build wrappers in `scripts/build-mobile.mjs`. Do not pollute root `package.json` with native compilation tools.
2. **Build Toolchain Invariant**: Always execute Gradle builds using the Android Studio bundled JDK (`C:\Program Files\Android\Android Studio\jbr`) and local Android SDK (`C:\Users\JV\AppData\Local\Android\Sdk`). Avoid invoking incompatible system JDKs (such as Java 25) with the Android Gradle Plugin.
3. **Execution Script**: Use `npm run mobile:build` (or `npm run mobile:build:clean`) to generate production-ready signed release APKs placed in `output/`.
4. **Target URL Support**: The build defaults to `https://i-reside-capstone.vercel.app/mobile` and can be overridden via `node scripts/build-mobile.mjs --url=<endpoint>` for staging or local environments.
5. **Zero Next.js Regression**: Any mobile-related change must preserve 100% clean passes on `npx tsc --noEmit`, `npx vitest run src/__tests__/validation`, and `npm run build`.
