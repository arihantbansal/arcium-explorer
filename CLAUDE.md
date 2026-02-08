# CLAUDE.md — Project Operating Rules

This document defines how Claude should behave inside this repository.
It is a living standard and must be kept up to date as the project evolves.

---

## 1. Continuous Project Memory & Documentation

Claude must maintain an accurate and evolving knowledge base for this project.

After every major change, bugfix, or workflow discovery:

- Update this `CLAUDE.md` with new rules, conventions, or learnings
- Record solutions to tricky bugs so they are not repeated
- Capture any non-obvious workflow or architectural constraints

Default closing instruction after corrections:

> "Update your CLAUDE.md so you don’t make that mistake again."

---

## 2. Plan Mode is Required for Non-Trivial Work

Claude must enter **plan mode first** for any task that is:

- More than ~3 steps
- Expected to take >30 minutes
- Architecturally meaningful
- Touching core systems

Plan mode must include:

1. A step-by-step implementation plan
2. A senior/staff-level self-review of the plan
3. Explicit verification steps before coding

If execution goes sideways:

- Stop immediately
- Return to plan mode
- Re-plan instead of pushing forward blindly

---

## 3. Verification Before Completion

Claude must never mark work “done” without proving correctness.

Required verification:

- Run relevant tests / CI checks
- Inspect logs or runtime behavior where applicable
- Diff behavior vs `main` when meaningful

Ask internally:

> “Would a staff engineer approve this as complete?”

---

## 4. Worktree-First Parallel Workflow

For complex or multi-threaded work, prefer `git worktree`.

Rules:

- One task = one worktree
- One Claude session per worktree
- Contexts remain isolated

Suggested naming:

- `wt-feature-*`
- `wt-bugfix-*`
- `wt-analysis` (logs, review, metrics)

---

## 5. Reference Workspace Convention (`/ref`)

Each project should include a gitignored `/ref` folder for:

- Architecture notes
- Investigation logs
- Design sketches
- Task plans and context dumps

Claude should create it automatically if missing.

---

## 6. Autonomous Debugging Expectations

Claude should fix most bugs end-to-end with minimal micromanagement.

Given:

- failing CI
- logs
- bug reports
- Slack threads

Claude should:

- diagnose root cause
- implement the correct fix
- verify resolution
- only escalate if genuinely blocked

No temporary patches or shallow fixes.

---

## 7. Reviewer-Grade Engineering Standards

Claude should behave like a strong reviewer, not just an implementer.

Defaults:

- Challenge mediocre solutions
- Reduce surface area of change
- Prefer root-cause fixes over hacks

Prompt mindset:

- “Prove this works vs main.”
- “Is there a more elegant solution?”

Avoid over-engineering for simple fixes.

---

## 8. Subagents for Parallelism

When complexity grows, Claude should offload subtasks to subagents:

- log scanning
- research
- refactoring exploration
- test writing
- plan review

Main agent remains focused on integration and correctness.

---

## 9. Git & Commit Policy

When generating commits or PR text:

- Do **NOT** include “Co-authored-by: Claude”
- Keep commits clean and human-authored

---

## 10. Workflow Reuse via Commands / Skills

If a workflow happens more than once per day, convert it into a reusable command.

Examples:

- `/techdebt` → duplicated code, cleanup opportunities
- `/contextdump` → sync key docs/issues into `/ref`
- `/releasecheck` → CI + changelog + version sanity
- `/metrics` → query performance/usage data

Skills should be committed and reused across projects.

---

## 11. Environment & Terminal Discipline

Recommended practices:

- One terminal/tmux tab per worktree
- Keep branch + context visible (statusline)
- Avoid context mixing across tasks

Preferred tooling:

- `rg` over `grep`
- `fd` over `find`
- `bat` over `cat`
- `eza` over `ls`

---

## 12. Data & Analytics Integration

Claude should use CLI-based analytics where available:

- BigQuery-style workflows
- RPC metrics
- Database CLIs

Support analysis with tools like:

- `jq`, `rg`, custom skills

---

## 13. Learning Mode (Onboarding / Unfamiliar Systems)

When exploring unfamiliar code:

- Use explanatory output
- Request diagrams or walkthroughs when useful
- Store important discoveries in `/ref`

---

## Post-Task Checklist (Always)

At the end of every major task or PR:

- Update `CLAUDE.md` with new rules/lessons
- Store plans/logs in `/ref`
- Run `/techdebt` when appropriate
- Ensure CI is green
- Keep commits clean (no Claude co-author)