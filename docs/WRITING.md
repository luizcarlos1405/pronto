# Writing Guide

Faz is a companion, not a boss. Every word in the app should feel like a calm friend helping you
stay on track — never like a drill sergeant barking orders.

## Tone

- **Friendly, not familiar.** Warm and approachable, but don't overstep. No "hey bestie" or
  excessive enthusiasm.
- **Calm, not cold.** Matter-of-fact without being robotic. A small spark of personality is
  welcome; performative pep talks are not.
- **Optimistic, not presumptuous.** Assume the user _can_ do things — don't assume they _will_ or
  that everything is always great. Avoid toxic positivity ("You're crushing it!") when someone has
  12 overdue tasks.
- **Helpful, not preachy.** Guide, don't lecture. Explain what happened, not what the user should
  feel about it.

## Voice Rules

| Do                                       | Don't                                                    |
| ---------------------------------------- | -------------------------------------------------------- |
| Use plain, everyday language             | Use jargon, corporate-speak, or motivational quotes      |
| Keep messages short                      | Write paragraphs for simple interactions                 |
| Use sentence case for UI copy            | Use Title Case For Everything Like This                  |
| Use contractions when they sound natural | Avoid them to sound "professional"                       |
| Acknowledge effort when relevant         | Hand out empty praise ("Amazing! You completed a task!") |
| Say "nothing here yet"                   | Say "You have no items" (sounds stern)                   |
| Say "Add your first task"                | Say "Start being productive today!"                      |

## Specific Patterns

### Empty States

Show a gentle nudge, not guilt.

- "No tasks for today. Enjoy the quiet — or add something new."
- "Your inbox is empty. Nice."
- "No goals yet. Tap + to set one."

### Errors

Be honest, brief, and offer a next step.

- "Something went wrong saving this. Try again?"
- "Couldn't load your tasks. Pull to retry."

### Confirmations & Success

Skip the fanfare. A quiet confirmation is enough.

- "Done" instead of "Task completed successfully!"
- "Saved" instead of "Your changes have been saved!"

### Dates & Deadlines

Be matter-of-fact. No alarmist language.

- "Due tomorrow" — not "Due tomorrow — don't forget!"
- "Overdue by 3 days" — not "This is 3 days late!"

### Motivational Language

Light touch only. If you're unsure whether something is too much, it probably is.

- Okay: "You're on a roll" (after a clear streak of completions)
- Not okay: "You're a productivity superstar!"

## Word Choices

| Prefer          | Avoid                                                  |
| --------------- | ------------------------------------------------------ |
| done, finished  | completed, accomplished                                |
| remove          | delete (in user-facing copy; "delete" is fine in code) |
| set up          | configure                                              |
| add             | create (for simple items)                              |
| tap, click      | leverage, utilize                                      |
| today, tomorrow | the current date, the following day                    |

## In Practice

When writing or reviewing copy, ask yourself:

1. Would I say this to a friend sitting next to me?
2. Does this add pressure or reduce it?
3. Is this the shortest clear version?

If the answer to (3) is no, cut it down.
