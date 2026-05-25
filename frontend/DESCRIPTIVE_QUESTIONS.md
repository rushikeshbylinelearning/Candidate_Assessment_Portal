# Descriptive Questions — Text Area Support

## Overview

The assessment UI fully supports descriptive questions that require text-based answers. When a question type is set to any of the supported text types, a styled textarea automatically appears for the candidate to enter their response.

## Supported Question Types

The following question types will render a textarea:

| Type | Description | Rows | Placeholder |
|------|-------------|------|-------------|
| `short_answer` | Brief text response | 6 | "Any suggestions, comments, or feedback..." |
| `scenario` | Scenario-based response | 6 | "Describe your approach to this scenario..." |
| `logic` | Logic/reasoning explanation | 6 | "Explain your reasoning..." |
| `descriptive` | General descriptive answer | 6 | "Any suggestions, comments, or feedback..." |
| `text` | Plain text answer | 6 | "Any suggestions, comments, or feedback..." |
| `essay` | Long-form essay response | 8 | "Write your detailed response here..." |
| `coding` | Code snippet (monospace) | 12 | "// Write your code here..." |

## Visual Design

### Standard Textarea

```
┌────────────────────────────────────────────────────────────┐
│ Any suggestions, comments, or feedback regarding the       │
│ interview process, interviewer approach, or overall        │
│ candidate                                                  │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
                                              150 characters
```

**Features:**
- White background with light gray border
- 14px padding
- 8px border radius
- Minimum height: 120px (desktop), 100px (mobile)
- Resizable vertically
- Character count displayed below (when text is entered)

### Coding Textarea

```
┌────────────────────────────────────────────────────────────┐
│ // Write your code here...                                 │
│                                                            │
│ function calculateTotal(apples, oranges) {                 │
│   return (apples * 2) + (oranges * 3);                    │
│ }                                                          │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
                                              120 characters
```

**Features:**
- Dark navy background (#0F172A)
- Light text color (#E2E8F0)
- Monospace font (Fira Code, Cascadia Code, Consolas)
- 13px font size
- Minimum height: 200px (desktop), 160px (mobile)

## States

### Default (Empty)

```css
border: 1.5px solid #E2E8F0
background: #FFFFFF
color: #0F172A
```

### Hover

```css
border: 1.5px solid #CBD5E1  /* Slightly darker */
```

### Focus (Active)

```css
border: 1.5px solid #3B82F6  /* Blue accent */
box-shadow: 0 0 0 3px rgba(59,130,246,0.12)  /* Blue glow */
```

### With Text

```css
/* Same as default, plus character count below */
```

## Placeholder Text

Placeholders are styled with:
- Color: Navy soft (#334155) with 50% opacity
- Font style: Italic
- Disappears when user starts typing

## Character Count

When the user enters text, a character count appears below the textarea:

```
150 characters
```

**Styling:**
- Font size: 12px
- Color: Navy soft (#334155)
- Alignment: Right
- Margin top: 6px

## Responsive Behavior

### Desktop (> 1024px)

- Font size: 15px
- Padding: 14px 16px
- Min height: 120px (standard), 200px (coding)

### Tablet (640px–1024px)

- Font size: 15px
- Padding: 14px 16px
- Min height: 120px (standard), 200px (coding)

### Mobile (< 640px)

- Font size: 14px
- Padding: 12px 14px
- Min height: 100px (standard), 160px (coding)

## Accessibility

### Keyboard Support

- **Tab**: Focus textarea
- **Shift+Tab**: Move focus away
- **Enter**: New line (not submit)
- **Esc**: Blur textarea

### ARIA Attributes

```html
<textarea
  aria-label="Answer input"
  aria-labelledby="ar-question-text"
  role="textbox"
  aria-multiline="true"
/>
```

### Screen Reader

Announces:
- "Answer input, text area"
- Question text (via aria-labelledby)
- Character count (when present)

## Auto-Save

Text entered in the textarea is automatically saved after 800ms of inactivity:

1. User types in textarea
2. 800ms debounce timer starts
3. If no more typing, auto-save triggers
4. Pulsing dot appears in topbar ("Saving...")
5. Answer saved to backend via `/api/tokens/answer`

## Backend Integration

### Question Object

```json
{
  "_id": "q5",
  "type": "descriptive",  // or short_answer, scenario, etc.
  "text": "Do you have any suggestions or feedback to help us improve our interview process?",
  "category": "Feedback",
  "difficulty": "easy",
  "points": 5
}
```

**Note:** No `options` array needed for text-based questions.

### Answer Format

```json
{
  "questionId": "q5",
  "answer": "I thought the interview process was well-structured. The technical questions were challenging but fair. One suggestion would be to provide more context about the company culture during the interview.",
  "timeSpent": 120  // seconds
}
```

**Note:** Answer is a string (not an option ID).

## Example Usage

### Standard Descriptive Question

```json
{
  "_id": "q1",
  "type": "descriptive",
  "text": "Describe your experience with React and state management.",
  "category": "Technical",
  "difficulty": "medium",
  "points": 10
}
```

**Renders:**
- Question text in Sora font (18px)
- Textarea with placeholder: "Any suggestions, comments, or feedback..."
- 6 rows (expandable)
- Character count when typing

### Scenario Question

```json
{
  "_id": "q2",
  "type": "scenario",
  "text": "You discover a critical bug in production. Walk us through your approach to resolving it.",
  "category": "Problem Solving",
  "difficulty": "hard",
  "points": 15
}
```

**Renders:**
- Question text in Sora font (18px)
- Textarea with placeholder: "Describe your approach to this scenario..."
- 6 rows (expandable)
- Character count when typing

### Coding Question

```json
{
  "_id": "q3",
  "type": "coding",
  "text": "Write a function that calculates the total cost of apples and oranges.",
  "category": "Coding",
  "difficulty": "medium",
  "points": 20
}
```

**Renders:**
- Question text in Sora font (18px)
- Dark textarea with monospace font
- Placeholder: "// Write your code here..."
- 12 rows (expandable)
- Character count when typing

## Validation

### Client-Side

- Empty textarea is considered "unanswered"
- Whitespace-only text is considered "unanswered"
- Character count updates in real-time
- No maximum character limit enforced (backend should handle)

### Backend

Backend should validate:
- Answer is a non-empty string
- Answer length is within acceptable range (e.g., 1–10,000 characters)
- Answer contains meaningful content (not just whitespace)

## Styling Customization

All textarea styles are defined in CSS custom properties:

```css
/* Textarea colors */
--ar-white: #FFFFFF;       /* Background */
--ar-border: #E2E8F0;      /* Border */
--ar-navy: #0F172A;        /* Text color */
--ar-blue: #3B82F6;        /* Focus border */

/* Textarea sizing */
--ar-r: 8px;               /* Border radius */
```

To customize, edit these variables in `AssessmentRunner.jsx` (lines 10-50).

## Common Issues

### Issue: Textarea not appearing

**Cause:** Question type not in supported list  
**Solution:** Ensure question type is one of: `short_answer`, `scenario`, `logic`, `coding`, `descriptive`, `text`, `essay`

### Issue: Placeholder not showing

**Cause:** Textarea already has a value  
**Solution:** Placeholders only show when textarea is empty

### Issue: Character count not updating

**Cause:** Answer value is null or undefined  
**Solution:** Character count only shows when `answers[q._id]` has a value

### Issue: Auto-save not working

**Cause:** Backend endpoint not responding  
**Solution:** Check `/api/tokens/answer` endpoint is accessible and accepts POST requests

## Testing Checklist

- [ ] Textarea appears for all supported question types
- [ ] Placeholder text is correct for each type
- [ ] Textarea is resizable vertically
- [ ] Character count appears when typing
- [ ] Character count updates in real-time
- [ ] Focus state shows blue border and glow
- [ ] Hover state shows darker border
- [ ] Auto-save triggers after 800ms
- [ ] Saving indicator appears in topbar
- [ ] Answer persists on page refresh
- [ ] Textarea is responsive on mobile
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces textarea correctly

---

**Last Updated:** 2026-04-30  
**Version:** 2.0.0  
**Status:** ✅ Implemented
