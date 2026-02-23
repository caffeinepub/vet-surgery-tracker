# Specification

## Summary
**Goal:** Fix the AuthProvider context error that occurs in the production build of the application.

**Planned changes:**
- Ensure AuthProvider from frontend/src/contexts/AuthContext.tsx properly wraps the App component in frontend/src/main.tsx
- Verify the correct nesting order: QueryClientProvider > InternetIdentityProvider > AuthProvider > App
- Confirm that the AuthProvider wrapper persists through the production build process and is not stripped or reordered during bundling

**User-visible outcome:** The live app loads without the "useAuth must be used within an AuthProvider" error, and users can access all authentication-dependent features without runtime errors.
