# Specification

## Summary
**Goal:** Restore the stopped backend canister so all case data is accessible again, and improve the frontend error handling on the Cases page.

**Planned changes:**
- Redeploy the backend canister (3m4vr-hiaaa-aaaac-ba7sa-cai) to bring it back to a running/started state without data loss, so `getAllCases` and other methods respond correctly.
- Update the Cases page to display a user-friendly message ("Unable to connect to the server. Please try again later.") when the backend is unreachable or returns a canister-stopped error, hiding raw IC rejection details.
- Add a Retry button on the Cases page error state that triggers a re-fetch of cases.

**User-visible outcome:** The Cases page loads surgery cases normally. If the backend is ever unreachable, users see a friendly error message with a Retry button instead of raw rejection/IC error text.
