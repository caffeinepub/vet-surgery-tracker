# Specification

## Summary
**Goal:** Fix browser console warnings related to the PWA manifest meta tag and icon resource in the SurgiPaw frontend.

**Planned changes:**
- Add `<meta name="mobile-web-app-capable" content="yes">` to `frontend/index.html` to resolve the deprecation warning for `apple-mobile-web-app-capable`
- Update `frontend/public/manifest.json` to reference valid PNG icon files (192x192 and 512x512) instead of the `.ico` file, removing the `IMG_4505.ico` reference

**User-visible outcome:** No PWA-related errors or deprecation warnings appear in the browser console when using the app.
