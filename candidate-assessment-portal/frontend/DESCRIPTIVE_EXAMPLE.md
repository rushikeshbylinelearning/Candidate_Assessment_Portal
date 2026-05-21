# Descriptive Question — Visual Example

## How It Looks

### Desktop View

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ┌──┐                                                                       │
│  │H │  Post Interview Form (1)         ⏱ 05:11        5 of 5  Dashboard   │
│  └──┘                                  remaining                           │
└────────────────────────────────────────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────────────────────────────────┐
│          │                                                                  │
│ QUESTIONS│  ┌────────────────────────────────────────────────────────────┐ │
│          │  │ [Technical] [Easy]                             ✓ Answered  │ │
│ ┌──┬──┬──┤  │                                                             │ │
│ │1 │2 │3 ││  │ QUESTION 5 OF 5                                            │ │
│ ├──┼──┼──┤│  │                                                             │ │
│ │4 │5 │  ││  │ Do you have any suggestions or feedback to help us        │ │
│ └──┴──┴──┘│  │ improve our interview process?                             │ │
│           │  │                                                             │ │
│ Legend    │  │ ┌────────────────────────────────────────────────────────┐│ │
│ ━━━━━━    │  │ │ Any suggestions, comments, or feedback regarding the  ││ │
│ ■ Current │  │ │ interview process, interviewer approach, or overall   ││ │
│ ■ Answered│  │ │ candidate                                              ││ │
│ □ Unanswer│  │ │                                                        ││ │
│           │  │ │                                                        ││ │
│ PROGRESS  │  │ │                                                        ││ │
│ ━━━━━━    │  │ └────────────────────────────────────────────────────────┘│ │
│ █████     │  │                                              150 characters │ │
│ 5/5       │  │                                                             │ │
│           │  │ ─────────────────────────────────────────────────────────  │ │
│           │  │ [← Previous]      [🔖 Flag for Review]      [Submit]      │ │
│           │  └────────────────────────────────────────────────────────────┘ │
│           │                                                                  │
│ Sidebar   │  ┌────────────────────────────────────────────────────────────┐ │
│ 240px     │  │ You've answered 5/5 questions. Ready to submit!            │ │
│           │  │                                    [Finish & Submit]        │ │
│           │  └────────────────────────────────────────────────────────────┘ │
└───────────┴─────────────────────────────────────────────────────────────────┘
```

### Mobile View

```
┌──────────────────────────────────────┐
│ ┌──┐                                 │
│ │H │ Post Interview    ⏱ 05:11      │
│ └──┘                  5 of 5         │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ ① ② ③ ④ ⑤                           │
└──────────────────────────────────────┘
│                                      │
│ ┌──────────────────────────────────┐ │
│ │[Technical][Easy]             ✓   │ │
│ │                                  │ │
│ │ Q5 OF 5                          │ │
│ │                                  │ │
│ │ Do you have any suggestions or   │ │
│ │ feedback to help us improve our  │ │
│ │ interview process?               │ │
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ Any suggestions, comments,   │ │ │
│ │ │ or feedback regarding the    │ │ │
│ │ │ interview process...         │ │ │
│ │ │                              │ │ │
│ │ │                              │ │ │
│ │ └──────────────────────────────┘ │ │
│ │                   150 characters │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 5/5 answered. Ready to submit!   │ │
│ │ [Finish & Submit]                │ │
│ └──────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ [← Prev]      [🔖]      [Submit]     │
└──────────────────────────────────────┘
```

## Textarea States

### Empty (with placeholder)

```
┌────────────────────────────────────────────────────────────┐
│ Any suggestions, comments, or feedback regarding the       │
│ interview process, interviewer approach, or overall        │
│ candidate                                                  │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Styling:**
- Border: 1.5px solid #E2E8F0 (light gray)
- Background: #FFFFFF (white)
- Placeholder: Italic, gray, 50% opacity

### Hover

```
┌────────────────────────────────────────────────────────────┐
│ Any suggestions, comments, or feedback regarding the       │
│ interview process, interviewer approach, or overall        │
│ candidate                                                  │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Styling:**
- Border: 1.5px solid #CBD5E1 (darker gray)
- Smooth transition (150ms)

### Focus (typing)

```
┌────────────────────────────────────────────────────────────┐
│ I thought the interview process was well-structured. The   │
│ technical questions were challenging but fair. One         │
│ suggestion would be to provide more context about the      │
│ company culture during the interview.                      │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
                                              150 characters
```

**Styling:**
- Border: 1.5px solid #3B82F6 (blue)
- Box shadow: 0 0 0 3px rgba(59,130,246,0.12) (blue glow)
- Character count appears below

### With Text (blurred)

```
┌────────────────────────────────────────────────────────────┐
│ I thought the interview process was well-structured. The   │
│ technical questions were challenging but fair. One         │
│ suggestion would be to provide more context about the      │
│ company culture during the interview.                      │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
                                              150 characters
```

**Styling:**
- Border: 1.5px solid #E2E8F0 (light gray)
- Character count remains visible

## Coding Question Example

### Question

```
QUESTION 3 OF 9

Write a function that calculates the total cost of apples and oranges.
Apples cost $2 each and oranges cost $3 each.
```

### Textarea (coding type)

```
┌────────────────────────────────────────────────────────────┐
│ // Write your code here...                                 │
│                                                            │
│ function calculateTotal(apples, oranges) {                 │
│   const appleCost = apples * 2;                           │
│   const orangeCost = oranges * 3;                         │
│   return appleCost + orangeCost;                          │
│ }                                                          │
│                                                            │
│ // Test                                                    │
│ console.log(calculateTotal(4, 3)); // Output: 17          │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
                                              180 characters
```

**Styling:**
- Background: #0F172A (dark navy)
- Text color: #E2E8F0 (light gray)
- Font: Monospace (Fira Code, Cascadia Code, Consolas)
- Font size: 13px
- Min height: 200px (desktop), 160px (mobile)
- 12 rows

## Scenario Question Example

### Question

```
QUESTION 4 OF 9

You discover a critical bug in production that's affecting 10% of users.
Walk us through your approach to resolving it.
```

### Textarea (scenario type)

```
┌────────────────────────────────────────────────────────────┐
│ Describe your approach to this scenario...                 │
│                                                            │
│ 1. Immediately assess the impact and severity             │
│ 2. Notify the team and stakeholders                       │
│ 3. Roll back to the previous stable version if possible   │
│ 4. Investigate the root cause using logs and monitoring   │
│ 5. Develop and test a fix in a staging environment        │
│ 6. Deploy the fix with proper testing and monitoring      │
│ 7. Document the incident and conduct a post-mortem        │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
                                              320 characters
```

**Styling:**
- Same as standard textarea
- Placeholder: "Describe your approach to this scenario..."
- 6 rows (expandable)

## Character Count

The character count appears below the textarea when text is entered:

```
150 characters
```

**Features:**
- Updates in real-time as user types
- Right-aligned
- Font size: 12px
- Color: Navy soft (#334155)
- Only visible when textarea has content

## Auto-Save Indicator

When the user types, auto-save triggers after 800ms:

```
Topbar:
┌────────────────────────────────────────────────────────────┐
│  [H] Assessment Title    ⏱ 50:52    ● Saving    1 of 9    │
│                                      ↑                      │
│                                  Pulsing dot                │
└────────────────────────────────────────────────────────────┘
```

**Sequence:**
1. User types in textarea
2. 800ms debounce timer starts
3. If no more typing, "Saving" indicator appears
4. Answer saved to backend
5. Indicator disappears

## Responsive Behavior

### Desktop (> 1024px)

- Font size: 15px
- Padding: 14px 16px
- Min height: 120px (standard), 200px (coding)
- Border radius: 8px

### Tablet (640px–1024px)

- Font size: 15px
- Padding: 14px 16px
- Min height: 120px (standard), 200px (coding)
- Border radius: 8px

### Mobile (< 640px)

- Font size: 14px
- Padding: 12px 14px
- Min height: 100px (standard), 160px (coding)
- Border radius: 8px

## Backend Data Format

### Question Object

```json
{
  "_id": "q5",
  "type": "descriptive",
  "text": "Do you have any suggestions or feedback to help us improve our interview process?",
  "category": "Technical",
  "difficulty": "easy",
  "points": 5
}
```

### Answer Object

```json
{
  "questionId": "q5",
  "answer": "I thought the interview process was well-structured. The technical questions were challenging but fair. One suggestion would be to provide more context about the company culture during the interview.",
  "timeSpent": 120
}
```

## Accessibility

### Keyboard Navigation

- **Tab**: Focus textarea
- **Shift+Tab**: Move focus away
- **Enter**: New line (not submit)
- **Esc**: Blur textarea

### Screen Reader

Announces:
- "Answer input, text area, multi-line"
- Question text (via aria-labelledby)
- "150 characters" (when character count is present)

### ARIA Attributes

```html
<textarea
  aria-label="Answer input"
  aria-labelledby="ar-question-text"
  role="textbox"
  aria-multiline="true"
/>
```

---

**Last Updated:** 2026-04-30  
**Version:** 2.0.0  
**Status:** ✅ Implemented
