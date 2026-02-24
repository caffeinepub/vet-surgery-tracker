# Specification

## Summary
**Goal:** Fix multiple field parsing bugs in the Quick Fill from Text parser (`parseStructuredText.ts`) so that pet name, owner name, sex, and date of birth are all correctly extracted and populated in the form.

**Planned changes:**
- Fix field boundary detection so that "Pet Name" captures only the pet name value (e.g., "Kitten") without appending the next field label ("owner")
- Fix field boundary detection so that "Owner name" captures only the owner name value (e.g., "Beatty") without appending the next field label ("species")
- Fix the "Sex" field matching to correctly capture multi-word values such as "Neutered Male", "Spayed Female", "Intact Male", and "Intact Female", and map them to the correct form option
- Fix the "Date of Birth" / "DOB" field matching to recognize the label and parse date values in MM/DD/YYYY format, then populate the DOB form field

**User-visible outcome:** When a user pastes a structured text block into the Quick Fill dialog and clicks Parse & Fill, Pet Name, Owner Name, Sex, and Date of Birth fields are all correctly populated without extra label text or empty values.
