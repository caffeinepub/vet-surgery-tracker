# Specification

## Summary
**Goal:** Fix empty state handling on the Dashboard and Cases list pages, and resolve duplicate agent initialization warnings in the SurgiPaw frontend.

**Planned changes:**
- Update the Dashboard page to display a clean empty state UI (with a message like "No cases yet — add your first surgery case" and a "New Case" button) when the canister returns zero cases, instead of a blank or broken area.
- Update the Cases list page (CasesListView) to display a consistent empty state UI when the canister returns zero cases, with search/filter controls handling the empty dataset gracefully.
- Fix the `createActor` call to pass either `agent` or `agentOptions` (not both), eliminating the "Detected both agent and agentOptions" console warning while keeping all backend queries functional.

**User-visible outcome:** Users opening the app with an empty database will see friendly empty state messages with a clear call-to-action to add their first case, and the browser console will no longer show agent initialization warnings.
