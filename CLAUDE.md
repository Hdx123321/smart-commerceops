# CLAUDE.md

## IMPORTANT: This project has a Sense index — use it first

Sense tools are loaded at session start. Use them for ALL codebase understanding.

| Question | Tool |
|---|---|
| Who calls X? What does X call? | `sense_graph symbol="X"` |
| Find code related to a concept | `sense_search query="description"` |
| What breaks if I change X? | `sense_blast symbol="X"` |
| What patterns does this project follow? | `sense_conventions` |

**You MUST NOT:** spawn Explore/deep-explore agents, use grep/glob for symbol lookup, or skip Sense because tools are deferred.

**Verify list results:** For list outputs (dead code, blast radius, callers), verify a sample with grep before finalizing.

---

## Behavioral Guidelines (Andrej Karpathy)

These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project Context

See `CLAUDE_BOOTSTRAP_PROMPT.md` for full project context (roles, scope, architecture, coordination rules).
See `CONTRIBUTING.md` for session startup checklist and sync protocol.
See `DESIGN.md` for the design system (two-canvas: Cinematic + Transactional).
