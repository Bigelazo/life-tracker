# Life Tracker

A single-user personal-productivity hub for habit tracking, finance logging, and note-taking. The glossary below captures the terms the codebase and the design system share so a future reader doesn't trip over synonyms.

## Language

**Habit**:
The core unit tracked; recurs Daily / N-per-week / Weekdays; carries a Progression kind (Build or Quit) and may be Quantifiable.
_Avoid_: task, ritual, todo

**Build habit**:
A positive action to repeat (e.g. "Read 20 pages"). Each done-day increments a streak.
_Avoid_: positive habit, good habit

**Quit habit**:
A negative action to avoid (e.g. "No sugary drinks"). An elapsed-days counter increments daily from the last relapse.
_Avoid_: negative habit, bad habit, "isNegative" (implementation name only)

**Quantifiable habit**:
A habit with a numeric `target` + `unit` (e.g. 2000 ml water); the day is "done" when `currentAmount ≥ target`. Progress is measured as a [0,1]-clamped ratio.
_Avoid_: measurable habit, target habit

**Relapse**:
A destructive reset action available only on Quit habits; zeroes the elapsed counter. Confirmed before firing so a misclick never causes a lost streak.
_Avoid_: lapse, slip

**Streak**:
Consecutive count: done-days for Build habits, un-relapsed days for Quit habits. Rendered as "11 days".
_Avoid_: chain, run

**Elapsed**:
For Quit habits only: days since the last relapse. Rendered as "3d ago".
_Avoid_: counter, days-since

**Section**:
One of four top-level route surfaces: Today / Habits / Finance / Notes.
_Avoid_: page, route, tab