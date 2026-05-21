# Assessment UI Redesign — Visual Guide

## 🎨 Complete Layout Overview

### Desktop Layout (> 1024px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ┌──┐                                                                       │
│  │H │  Candidate Evaluation Form v2        ⏱ 50:52        1 of 9  Dashboard│ ← Sticky Navy Topbar
│  └──┘  Software Engineer                  remaining                        │   (64px height)
└────────────────────────────────────────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────────────────────────────────┐
│          │                                                                  │
│ QUESTIONS│  ┌────────────────────────────────────────────────────────────┐ │
│          │  │ [Aptitude] [Medium] [5 pts]                    ✓ Answered  │ │
│ ┌──┬──┬──┤  │                                                             │ │
│ │1 │2 │3 ││  │ QUESTION 1 OF 9                                            │ │
│ ├──┼──┼──┤│  │                                                             │ │
│ │4 │5 │6 ││  │ A store sells apples at $2 each and oranges at $3 each.   │ │
│ ├──┼──┼──┤│  │ If you buy 4 apples and 3 oranges, what is the total      │ │
│ │7 │8 │9 ││  │ cost?                                                       │ │
│ └──┴──┴──┘│  │                                                             │ │
│           │  │ ┃ ○ $15                                                     │ │
│ Legend    │  │ ┃ ● $17  ← Selected (blue tint + left border)              │ │
│ ━━━━━━    │  │ ┃ ○ $18                                                     │ │
│ ■ Current │  │ ┃ ○ $20                                                     │ │
│ ■ Answered│  │                                                             │ │
│ □ Unanswer│  │ ─────────────────────────────────────────────────────────  │ │
│ ● Flagged │  │ [← Previous]      [🔖 Flag for Review]      [Next →]      │ │
│           │  └────────────────────────────────────────────────────────────┘ │
│ PROGRESS  │                                                                  │
│ ━━━━━━    │  ┌────────────────────────────────────────────────────────────┐ │
│ ████░░░░  │  │ You've answered 3/9 questions. 6 questions remaining.      │ │
│ 3/9       │  │ ⚠ Unanswered questions will be marked incorrect            │ │
│           │  │                                    [Finish & Submit (6 left)]│ │
│ Sidebar   │  └────────────────────────────────────────────────────────────┘ │
│ 240px     │                     Main Content Area (max 860px)               │
└───────────┴─────────────────────────────────────────────────────────────────┘
```

### Tablet Layout (640px–1024px)

```
┌────────────────────────────────────────────────────────┐
│  ┌──┐                                                   │
│  │H │  Assessment Title    ⏱ 50:52    1 of 9  Dashboard│ ← Topbar
│  └──┘                     remaining                     │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨  →                                  │ ← Horizontal Nav Pills
└────────────────────────────────────────────────────────┘
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [Aptitude] [Medium] [5 pts]        ✓ Answered      │ │
│  │                                                     │ │
│  │ QUESTION 1 OF 9                                    │ │
│  │                                                     │ │
│  │ Question text here...                              │ │
│  │                                                     │ │
│  │ ┃ ○ Option A                                       │ │
│  │ ┃ ● Option B (selected)                            │ │
│  │ ┃ ○ Option C                                       │ │
│  │ ┃ ○ Option D                                       │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ You've answered 3/9 questions.                     │ │
│  │ [Finish & Submit (6 left)]                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│  [← Prev]          [🔖]          [Next →]              │ ← Fixed Bottom Bar
└────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 640px)

```
┌──────────────────────────┐
│ ┌──┐                     │
│ │H │ Assessment  ⏱ 50:52 │ ← Compact Topbar
│ └──┘            1 of 9   │   (wraps if needed)
└──────────────────────────┘
┌──────────────────────────┐
│ ①②③④⑤⑥⑦⑧⑨ →            │ ← Horizontal Pills
└──────────────────────────┘
│                          │
│ ┌──────────────────────┐ │
│ │[Apt][Med][5pts]  ✓   │ │
│ │                      │ │
│ │ Q1 OF 9              │ │
│ │                      │ │
│ │ Question text...     │ │
│ │                      │ │
│ │ ┃ ○ Option A         │ │
│ │ ┃ ● Option B         │ │
│ │ ┃ ○ Option C         │ │
│ │                      │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 3/9 answered         │ │
│ │ [Submit (6 left)]    │ │
│ └──────────────────────┘ │
│                          │
│                          │
│                          │
└──────────────────────────┘
┌──────────────────────────┐
│ [← Prev] [🔖] [Next →]   │ ← Fixed Bottom
└──────────────────────────┘
```

## 🎯 Key Components

### 1. Timer Ring (SVG)

```
     Green (> 10 min)        Amber (< 10 min)        Red (< 3 min)
                                                      + Pulse Animation
        ╭───────╮               ╭───────╮               ╭───────╮
       ╱         ╲             ╱         ╲             ╱ ⚠ ⚠ ⚠ ╲
      │   50:52   │           │   09:45   │           │   02:30   │
       ╲         ╱             ╲         ╱             ╲ ⚠ ⚠ ⚠ ╱
        ╰───────╯               ╰───────╯               ╰───────╯
       remaining               remaining               remaining
```

**Features:**
- Circular SVG progress arc
- Color shifts: Green → Amber → Red
- Pulses when < 3 minutes
- Smooth 1s transition

### 2. Question Navigation Bubbles

```
Desktop Sidebar (5×2 grid):

┌──┬──┬──┬──┬──┐
│1 │2 │3 │4 │5 │  ← Row 1
├──┼──┼──┼──┼──┤
│6 │7 │8 │9 │  │  ← Row 2
└──┴──┴──┴──┴──┘

States:
■ Navy   = Current question
■ Blue   = Answered
□ Gray   = Unanswered
● Amber  = Flagged (dot indicator)

Mobile (horizontal pills):
① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨  →
```

### 3. Question Card

```
┌────────────────────────────────────────────────────────┐
│ [Category] [Difficulty] [Points]           ✓ Answered  │ ← Badges + Indicator
│                                                         │
│ QUESTION 1 OF 9                                        │ ← Blue accent label
│                                                         │
│ Question text in Sora serif font, 18px, line-height   │ ← Question text
│ 1.65 for optimal readability...                        │
│                                                         │
│ ┃ ○ Option A                                           │ ← Answer options
│ ┃ ● Option B (selected) ← Blue tint + left border     │   (full-width rows)
│ ┃ ○ Option C                                           │
│ ┃ ○ Option D                                           │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│ [← Previous]      [🔖 Flag for Review]      [Next →]  │ ← Action bar
└────────────────────────────────────────────────────────┘
```

### 4. Answer Option States

```
Default (unanswered):
┌────────────────────────────────────┐
│ ○ Option text here                 │
└────────────────────────────────────┘

Hover:
┌────────────────────────────────────┐
│┃○ Option text here (blue tint)     │ ← 3px blue left border
└────────────────────────────────────┘

Selected:
┌────────────────────────────────────┐
│┃● Option text here (blue tint)     │ ← Blue tint + border + bold
└────────────────────────────────────┘

Press (active):
┌──────────────────────────────────┐
│┃● Option (scale 0.98)             │ ← Subtle press effect
└──────────────────────────────────┘
```

### 5. Badges

```
Category Badge:          Difficulty Badges:           Points Badge:
┌─────────────┐         ┌──────┐ ┌────────┐ ┌──────┐ ┌────────┐
│ APTITUDE    │         │ EASY │ │ MEDIUM │ │ HARD │ │ 5 PTS  │
└─────────────┘         └──────┘ └────────┘ └──────┘ └────────┘
Blue outline            Green    Amber      Red      Gray
```

### 6. Progress Bar

```
Sidebar Progress:
┌────────────────────────┐
│ PROGRESS               │
│ ████████░░░░░░░░░░░░   │ ← Animated blue fill
│ 3/9 answered           │
└────────────────────────┘

Topbar Progress (text):
1 of 9
```

### 7. Submit CTA Card

```
All answered:
┌────────────────────────────────────────────────────────┐
│ You've answered 9/9 questions. Ready to submit!        │
│                                    [Finish & Submit]   │
└────────────────────────────────────────────────────────┘

With gaps:
┌────────────────────────────────────────────────────────┐
│ You've answered 3/9 questions. 6 questions remaining.  │
│ ⚠ Unanswered questions will be marked incorrect        │
│                                    [Submit (6 left)]   │
└────────────────────────────────────────────────────────┘
```

### 8. Confirmation Modal

```
┌────────────────────────────────────────┐
│                                        │
│            ┌────────┐                  │
│            │   📤   │                  │ ← Icon (green or amber)
│            └────────┘                  │
│                                        │
│       Submit Assessment?               │ ← Title
│                                        │
│   You've answered 3 of 9 questions.   │ ← Summary
│                                        │
│   ┌──────────────────────────────────┐│
│   │ ⚠ 6 questions unanswered —       ││ ← Warning (if gaps)
│   │   will be marked incorrect       ││
│   └──────────────────────────────────┘│
│                                        │
│   This action cannot be undone.       │
│                                        │
│   ┌──────────────┐ ┌────────────────┐│
│   │Review Answers│ │ Confirm Submit ││ ← Actions
│   └──────────────┘ └────────────────┘│
└────────────────────────────────────────┘
```

## 🎨 Color Palette

```
Primary Palette:
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ #0F172A│ │ #3B82F6│ │ #FFFFFF│ │ #F8FAFC│
│  Navy  │ │  Blue  │ │  White │ │   Bg   │
└────────┘ └────────┘ └────────┘ └────────┘

Semantic Colors:
┌────────┐ ┌────────┐ ┌────────┐
│ #16A34A│ │ #D97706│ │ #DC2626│
│  Green │ │  Amber │ │   Red  │
└────────┘ └────────┘ └────────┘
```

## 🔤 Typography

```
UI Labels (DM Sans):
┌─────────────────────────────────┐
│ QUESTION 1 OF 9                 │ ← 12px, bold, uppercase
│ [← Previous]  [Next →]          │ ← 14px, semibold
│ 3/9 answered                    │ ← 12px, regular
└─────────────────────────────────┘

Question Text (Sora):
┌─────────────────────────────────┐
│ A store sells apples at $2 each │ ← 18px, medium weight
│ and oranges at $3 each. If you  │   Line-height: 1.65
│ buy 4 apples and 3 oranges...   │
└─────────────────────────────────┘

Option Text (DM Sans):
┌─────────────────────────────────┐
│ ○ $15                           │ ← 15px, regular
│ ● $17 (selected)                │ ← 15px, medium (when selected)
└─────────────────────────────────┘
```

## 📐 Spacing & Sizing

```
Card Padding:
┌────────────────────────────────┐
│ ↕ 32px                         │
│ ← 32px →  Content  ← 32px →    │
│ ↕ 32px                         │
└────────────────────────────────┘

Border Radius:
┌────────┐  ┌──────────┐  ┌────────────┐
│ 6px    │  │ 8px      │  │ 12px       │
│ Small  │  │ Buttons  │  │ Cards      │
└────────┘  └──────────┘  └────────────┘

Shadows:
Card:   0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)
Hover:  0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)
Modal:  0 24px 48px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.10)
```

## 🎬 Animations

```
Question Transition (200ms):
┌────────┐         ┌────────┐
│ Q1     │  fade   │ Q2     │
│ ↓      │  slide  │        │
└────────┘    →    └────────┘
opacity: 0 → 1
transform: translateY(10px) → translateY(0)

Option Press Effect (150ms):
┌────────┐         ┌──────┐
│ Option │  click  │Option│
└────────┘    →    └──────┘
transform: scale(1) → scale(0.98)

Timer Pulse (< 3 min):
    ⏱         ⚠⏱⚠        ⏱
  normal  →  pulse  →  normal
1s ease-in-out infinite

Progress Bar Fill (400ms):
░░░░░░░░░░  →  ████░░░░░░
width: 0% → 33% (smooth ease)
```

## 🌙 Dark Mode

```
Light Mode:                    Dark Mode:
┌────────────────────┐        ┌────────────────────┐
│ ┌────────────────┐ │        │ ┌────────────────┐ │
│ │ White Card     │ │   →    │ │ Dark Card      │ │
│ │ Navy Text      │ │        │ │ Light Text     │ │
│ └────────────────┘ │        │ └────────────────┘ │
│ Light Gray Bg      │        │ Dark Navy Bg       │
└────────────────────┘        └────────────────────┘

Automatic via: @media (prefers-color-scheme: dark)
```

## ♿ Accessibility

```
Keyboard Navigation:
Tab → Tab → Tab → Enter
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│ Prev │→ │ Flag │→ │ Next │→ │Select│
└──────┘  └──────┘  └──────┘  └──────┘

Focus Ring (2px blue, 2px offset):
┌────────────────────────────┐
│ ┌────────────────────────┐ │ ← 2px offset
│ │ [Next →]               │ │
│ └────────────────────────┘ │
└────────────────────────────┘

ARIA Labels:
<button aria-label="Previous question">
<div role="radiogroup" aria-labelledby="question-text">
<div role="timer" aria-label="Time remaining: 50:52">
```

## 📱 Responsive Breakpoints

```
Mobile          Tablet          Desktop
< 640px         640–1024px      > 1024px

┌──────┐       ┌────────┐      ┌──────────────┐
│      │       │        │      │ ┌──┐         │
│  Q   │   →   │   Q    │  →   │ │  │    Q    │
│      │       │        │      │ └──┘         │
└──────┘       └────────┘      └──────────────┘
Single         Centered        Sidebar + Main
Column         Card            Two-Zone
```

## 🎯 Interactive States

```
Button States:
Default:  [Next →]
Hover:    [Next →]  ← Darker background
Active:   [Next →]  ← Slightly darker
Disabled: [Next →]  ← 35% opacity, no cursor

Option States:
Default:  ○ Option
Hover:    ┃○ Option  ← Blue tint + left border
Selected: ┃● Option  ← Blue tint + border + bold
Focus:    ┃○ Option  ← Blue focus ring (keyboard)
```

## 📊 Progress Indicators

```
Sidebar Progress Bar:
┌────────────────────────┐
│ PROGRESS               │
│ ████████░░░░░░░░░░░░   │ ← 33% filled
│ 3/9 answered           │
└────────────────────────┘

Topbar Progress Text:
1 of 9  ← Current question / Total

Question Bubbles:
■ ■ □ □ □ □ □ □ □  ← 2 answered, 7 remaining
```

## 🔖 Flag Indicator

```
Unflagged:               Flagged:
┌──┐                    ┌──┐●
│ 5│                    │ 5│  ← Amber dot (top-right)
└──┘                    └──┘

Button:
[🔖 Flag for Review]  →  [✓ Flagged]
Gray outline             Amber background
```

## ✅ Answered Indicator

```
Unanswered:              Answered:
┌────────────────┐      ┌────────────────┐
│ [Apt] [Med]    │      │ [Apt] [Med] ✓  │ ← Green checkmark
└────────────────┘      └────────────────┘
```

---

**Visual Guide Version:** 1.0.0  
**Last Updated:** 2026-04-30  
**For:** Assessment UI Redesign v2.0.0
