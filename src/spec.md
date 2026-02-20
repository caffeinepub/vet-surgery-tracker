# Specification

## Summary
**Goal:** Fix the backend actor availability issue that prevents users from creating new surgery cases through the web interface.

**Planned changes:**
- Diagnose and resolve backend actor initialization problems that cause "actor not available" errors
- Ensure the useActor hook properly recreates the actor instance after Internet Identity authentication
- Add error boundary with user-friendly error messaging and retry mechanism for actor connection failures
- Update CaseFormDialog to wait for actor availability before enabling case submission

**User-visible outcome:** Users can successfully add new surgery cases without encountering "actor not available" errors, with clear feedback when the backend is initializing and the ability to retry if connection issues occur.
