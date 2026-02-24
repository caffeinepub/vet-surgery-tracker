# Specification

## Summary
**Goal:** Enhance the Quick Fill feature with placeholder guidance and automatic field extraction from voice recordings.

**Planned changes:**
- Add placeholder text in the Quick Fill text box showing all nine field names (Medical Record number, Arrival Date, Pet Name, Owner Last Name, Species, Breed, Sex, Date of Birth, Presenting Complaint) as a guide
- Implement automatic parsing of voice recording transcriptions to extract and populate the nine veterinary case fields
- Enhance the parseStructuredText function to recognize field variations from voice-dictated text

**User-visible outcome:** Users will see helpful placeholder guidance in the Quick Fill box and have their voice recordings automatically parsed to populate case form fields, reducing manual data entry.
