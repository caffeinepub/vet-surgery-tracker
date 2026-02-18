# Specification

## Summary
**Goal:** Fix the Date of Birth field to populate correctly when using Quick Fill from structured text input.

**Planned changes:**
- Update the parseStructuredText function to recognize Date of Birth field labels (DOB, Date of Birth, Birth Date, Birthday)
- Add date parsing logic to handle ISO (YYYY-MM-DD), US (MM/DD/YYYY), and EU (DD/MM/YYYY) formats for the Date of Birth field
- Ensure the Date of Birth field updates immediately when Quick Fill is triggered

**User-visible outcome:** Users can now paste structured text containing date of birth information using Quick Fill, and the Date of Birth field will automatically populate with the correct date value.
