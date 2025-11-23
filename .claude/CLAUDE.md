# genart

Generative art and hardware projects, including Arduino/CircuitPython experiments.

## Memory System

**IMPORTANT**: Update this section frequently with project-specific context, decisions, and learnings.

**Memory Architecture:**
- This file contains **project-level** memories specific to this project
- Global/user-level memories live in `~/.claude/CLAUDE.md`
- **How to bubble up**: When you learn something important that applies across ALL projects:
  1. **Do it immediately** - don't wait until end of session
  2. Read `~/.claude/CLAUDE.md` to see the "Incoming memories" section
  3. Use the Edit tool to append a new line to that section
  4. Format: `- YYYY-MM-DD HH:MM TZ | [category] | project: <project-name> | <memory content>`
  5. Categories: `[tech-pref]`, `[workflow]`, `[tools]`, `[comm]`, `[general]`
  6. Example: `- 2025-11-22 15:30 PST | [tech-pref] | project: myapp | User prefers React hooks over class components`

### Recent Context & Memories

- 2025-11-23: Git repository is at `/Users/j/src/genart/` (parent directory), not in subdirectories like `arduino_goofin/`
- Work often happens in subdirectories (e.g., `arduino_goofin/`) but git operations affect the parent repo
- Project includes CircuitPython/Arduino hardware projects with utility scripts for macOS integration

### Preferences & Patterns

- Uses CircuitPython boards that trigger annoying macOS "DISK NOT EJECTED PROPERLY" notifications
- Added utilities in `bin/` directories to handle platform-specific annoyances

## Project Structure

- `arduino_goofin/` - CircuitPython/Arduino experiments
  - Work directory is typically here: `/Users/j/src/genart/arduino_goofin/`
  - Contains subdirectories for different hardware projects
  - Each project may have its own `bin/`, `lib/`, etc.
- Git repo root: `/Users/j/src/genart/`
