# Specification

## Summary
**Goal:** Fix voice recording transcription routing and Parse and Fill functionality to accurately extract all 9 case fields from spoken input.

**Planned changes:**
- Route transcribed text from voice recording into the Quick Fill text box instead of the Medical Record Number field
- Enhance Parse and Fill button to accurately extract all 9 case fields (Medical Record Number, Arrival Date, Pet Name, Owner Last Name, Species, Breed, Sex, Date of Birth, Presenting Complaint) when field names are spoken followed by values
- Improve date parsing to intelligently convert spoken number sequences into MM/DD/YYYY format for Arrival Date and Date of Birth fields

**User-visible outcome:** Users can speak case data by saying field names followed by values (e.g., "Medical Record Number 12345"), and the Parse and Fill button will accurately populate all 9 form fields, with dates properly formatted from spoken numbers.
