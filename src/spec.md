# Specification

## Summary
**Goal:** Add voice recording capability to the Quick Fill from Text feature, allowing users to dictate case information instead of typing.

**Planned changes:**
- Add a microphone button positioned to the right of the "Quick Fill from Text" label
- Implement toggle voice recording using Web Speech API (first click starts, second click stops)
- Automatically transcribe recorded speech to text and replace existing text in the Quick Fill input box
- Process transcribed text through existing parseStructuredText logic to auto-populate form fields

**User-visible outcome:** Users can click a microphone button to dictate case information, which is automatically transcribed and used to populate the surgery case form fields.
