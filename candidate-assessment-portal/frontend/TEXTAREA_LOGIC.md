# Textarea Display Logic — How It Works

## Overview

The assessment UI now **automatically shows a textarea** for any question that is descriptive (non-multiple-choice). The logic is smart and handles various scenarios.

## Decision Tree

```
Is the question type explicitly text-based?
├─ YES (short_answer, scenario, logic, coding, descriptive, text, essay)
│  └─ Show TEXTAREA
│
└─ NO
   ├─ Does the question have options?
   │  ├─ NO (options is null/undefined/empty array)
   │  │  └─ Show TEXTAREA (fallback for descriptive questions)
   │  │
   │  └─ YES (options array has items)
   │     ├─ Is type mcq_multi?
   │     │  └─ Show CHECKBOXES
   │     │
   │     ├─ Is type mcq_single or true_false?
   │     │  └─ Show RADIO BUTTONS
   │     │
   │     └─ Otherwise
   │        └─ Show TEXTAREA (fallback)
   │
   └─ Fallback: Show TEXTAREA
```

## Logic Implementation

### Priority 1: Explicit Text Types

If the question type is any of these, **always show textarea**:
- `short_answer`
- `scenario`
- `logic`
- `coding`
- `descriptive`
- `text`
- `essay`

**Example:**
```json
{
  "_id": "q1",
  "type": "descriptive",
  "text": "Describe your experience...",
  "options": []  // ← Ignored, textarea shown anyway
}
```

### Priority 2: No Options Available

If the question has **no options** (null, undefined, or empty array), **show textarea**:

**Example:**
```json
{
  "_id": "q2",
  "type": "mcq_single",  // ← Type doesn't matter
  "text": "What are your thoughts?",
  "options": []  // ← Empty, so textarea shown
}
```

or

```json
{
  "_id": "q3",
  "text": "Provide feedback...",
  // ← No options field, so textarea shown
}
```

### Priority 3: Multiple Choice with Options

If the question has options AND type is MCQ, **show radio/checkboxes**:

**Example (Radio Buttons):**
```json
{
  "_id": "q4",
  "type": "mcq_single",
  "text": "What is 2+2?",
  "options": ["3", "4", "5"]  // ← Has options, show radio buttons
}
```

**Example (Checkboxes):**
```json
{
  "_id": "q5",
  "type": "mcq_multi",
  "text": "Select all that apply:",
  "options": ["A", "B", "C"]  // ← Has options, show checkboxes
}
```

### Priority 4: Fallback

If none of the above match, **show textarea** as a safe fallback.

## Code Logic

```javascript
// Simplified version of the logic
if (
  // Explicit text types
  q.type === 'short_answer' || 
  q.type === 'scenario' || 
  q.type === 'logic' || 
  q.type === 'coding' || 
  q.type === 'descriptive' || 
  q.type === 'text' || 
  q.type === 'essay' ||
  // OR no options available
  !q.options || 
  q.options.length === 0
) {
  // Show TEXTAREA
  return <textarea ... />;
}
else if (q.type === 'mcq_multi' && q.options && q.options.length > 0) {
  // Show CHECKBOXES
  return <div className="ar-options">...</div>;
}
else if ((q.type === 'mcq_single' || q.type === 'true_false') && q.options && q.options.length > 0) {
  // Show RADIO BUTTONS
  return <div className="ar-options">...</div>;
}
else {
  // Fallback: Show TEXTAREA
  return <textarea ... />;
}
```

## Examples

### Example 1: Descriptive Question (Explicit Type)

**Backend:**
```json
{
  "_id": "q1",
  "type": "descriptive",
  "text": "Do you have any suggestions or feedback?",
  "category": "Feedback",
  "difficulty": "easy"
}
```

**Frontend:** Shows textarea with placeholder:
```
┌────────────────────────────────────────────────────────────┐
│ Any suggestions, comments, or feedback regarding the       │
│ interview process, interviewer approach, or overall        │
│ candidate                                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Example 2: Descriptive Question (No Options)

**Backend:**
```json
{
  "_id": "q2",
  "type": "mcq_single",  // ← Type is MCQ but...
  "text": "Explain your reasoning:",
  "options": []  // ← No options, so textarea shown
}
```

**Frontend:** Shows textarea (ignores the mcq_single type because no options)

### Example 3: Multiple Choice Question

**Backend:**
```json
{
  "_id": "q3",
  "type": "mcq_single",
  "text": "What is 2+2?",
  "options": ["3", "4", "5", "6"]
}
```

**Frontend:** Shows radio buttons:
```
○ 3
○ 4
○ 5
○ 6
```

### Example 4: Coding Question

**Backend:**
```json
{
  "_id": "q4",
  "type": "coding",
  "text": "Write a function to calculate total cost:",
  "category": "Coding"
}
```

**Frontend:** Shows dark monospace textarea:
```
┌────────────────────────────────────────────────────────────┐
│ // Write your code here...                                 │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Example 5: Scenario Question

**Backend:**
```json
{
  "_id": "q5",
  "type": "scenario",
  "text": "You discover a bug in production. What do you do?",
  "category": "Problem Solving"
}
```

**Frontend:** Shows textarea with scenario placeholder:
```
┌────────────────────────────────────────────────────────────┐
│ Describe your approach to this scenario...                 │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Backend Integration

### For Descriptive Questions

**Option 1: Use explicit type**
```json
{
  "type": "descriptive",  // or short_answer, text, essay, etc.
  "text": "Your question here..."
}
```

**Option 2: Omit options**
```json
{
  "type": "mcq_single",  // Type doesn't matter
  "text": "Your question here...",
  "options": []  // Empty array = textarea
}
```

**Option 3: No options field**
```json
{
  "text": "Your question here..."
  // No options field = textarea
}
```

### For Multiple Choice Questions

**Always include options:**
```json
{
  "type": "mcq_single",  // or mcq_multi, true_false
  "text": "Your question here...",
  "options": ["Option A", "Option B", "Option C"]  // Required
}
```

## Answer Format

### Textarea Answer

```json
{
  "questionId": "q1",
  "answer": "I thought the interview process was well-structured..."
}
```

**Note:** Answer is a **string**.

### Multiple Choice Answer (Single)

```json
{
  "questionId": "q2",
  "answer": "option_b"
}
```

**Note:** Answer is a **string** (option ID).

### Multiple Choice Answer (Multi)

```json
{
  "questionId": "q3",
  "answer": ["option_a", "option_c"]
}
```

**Note:** Answer is an **array of strings** (option IDs).

## Testing

### Test Case 1: Descriptive Question Shows Textarea

**Input:**
```json
{
  "type": "descriptive",
  "text": "Provide feedback..."
}
```

**Expected:** Textarea appears

### Test Case 2: Question with No Options Shows Textarea

**Input:**
```json
{
  "type": "mcq_single",
  "text": "Explain...",
  "options": []
}
```

**Expected:** Textarea appears (not radio buttons)

### Test Case 3: MCQ with Options Shows Radio Buttons

**Input:**
```json
{
  "type": "mcq_single",
  "text": "Choose one:",
  "options": ["A", "B", "C"]
}
```

**Expected:** Radio buttons appear

### Test Case 4: Coding Question Shows Dark Textarea

**Input:**
```json
{
  "type": "coding",
  "text": "Write code..."
}
```

**Expected:** Dark monospace textarea appears

### Test Case 5: Unknown Type with No Options Shows Textarea

**Input:**
```json
{
  "type": "unknown_type",
  "text": "Answer this..."
}
```

**Expected:** Textarea appears (fallback)

## Common Issues

### Issue: Textarea not showing for descriptive question

**Cause:** Question has `options` array with items AND type is `mcq_single`/`mcq_multi`

**Solution:** Either:
1. Set `type` to `descriptive`, `text`, or `short_answer`
2. Remove the `options` field
3. Set `options` to empty array `[]`

### Issue: Radio buttons showing instead of textarea

**Cause:** Question has `type: "mcq_single"` AND `options` array with items

**Solution:** Remove options or change type to text-based

### Issue: Textarea showing for MCQ question

**Cause:** Question has no `options` field or empty `options` array

**Solution:** Add options array with at least one option

## Summary

The logic is designed to be **smart and forgiving**:

1. **Explicit text types** always show textarea
2. **No options** = textarea (safe fallback for descriptive questions)
3. **Has options + MCQ type** = radio/checkboxes
4. **Everything else** = textarea (safe fallback)

This means you can create descriptive questions in multiple ways:
- Set `type: "descriptive"` (recommended)
- Set `type: "text"` or `"short_answer"`
- Omit the `options` field
- Set `options: []`

All of these will show a textarea for the candidate to type their answer.

---

**Last Updated:** 2026-04-30  
**Version:** 2.0.1  
**Status:** ✅ Implemented
