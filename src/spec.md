# Specification

## Summary
**Goal:** Force the Vet Surgery Tracker app UI to always render in light mode and ensure the light theme colors from `frontend/src/index.css` reliably apply.

**Planned changes:**
- Enforce light mode globally so the app does not follow OS/browser dark mode and does not apply a `dark` class to the root theme element.
- Resolve theme/color styles not applying by ensuring global theme configuration and styles are not being overridden by unintended dark-mode behavior or competing global styles.

**User-visible outcome:** The app consistently appears in the intended light theme on all screens (loading, logged-out, logged-in), and changing the OS theme no longer affects the app’s appearance.
