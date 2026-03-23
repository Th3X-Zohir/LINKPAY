# LinkPay BD - Multi-Agent System

> Orchestration file for LinkPay BD development agents

## Overview

LinkPay BD uses a **multi-agent workflow** where specialized agents handle different aspects of development. Each agent has a specific role, responsibilities, and can be invoked independently.

---

## Agent Roster

| Agent | File | Purpose |
|-------|------|---------|
| **Business Planner** | [agents/business-planner.md](agents/business-planner.md) | Business requirements, user stories, feature specs |
| **Software Architect** | [agents/software-architect.md](agents/software-architect.md) | System design, architecture decisions, tech stack |
| **Software Engineer** | [agents/software-engineer.md](agents/software-engineer.md) | Feature implementation, code writing |
| **Evaluator** | [agents/evaluator.md](agents/evaluator.md) | Code review, quality assurance, testing |
| **Fixer** | [agents/fixer.md](agents/fixer.md) | Bug fixes, error resolution, troubleshooting |

---

## Workflow Patterns

### Pattern 1: Feature Development (Full)
```
Business Planner → Software Architect → Software Engineer → Evaluator → Fixer (if needed)
```

### Pattern 2: Quick Feature (Skip Planner)
```
Software Architect → Software Engineer → Evaluator
```

### Pattern 3: Bug Fix
```
Evaluator (identifies) → Fixer (resolves) → Evaluator (verifies)
```

### Pattern 4: Business Requirement Only
```
Business Planner (creates spec) → Software Architect (designs)
```

---

## How to Invoke an Agent

Use the `runSubagent` tool with the agent name:

| Task | Invoke Agent |
|------|--------------|
| Create user stories from business plan | `business-planner` |
| Design new feature | `software-architect` |
| Implement payment link | `software-engineer` |
| Review PR | `evaluator` |
| Fix login bug | `fixer` |

### Example Usage

```
runSubagent: software-engineer
prompt: "Implement the payment link creation feature. Requirements:
- Amount input field
- Description field
- Generate shareable link
- Integration with aamarPay API"
```

---

## Agent Communication

Agents share context via:
- **Session Memory** — `/memories/session/` for current task state
- **Repository Memory** — `/memories/repo/` for project conventions
- **AGENT.md** — Main instructions at [AGENT.md](AGENT.md)

---

## Quality Gates

Each phase must pass evaluation before proceeding:

1. **Architecture** → Does design meet requirements?
2. **Implementation** → Does code match design?
3. **Review** → Are there bugs or issues?
4. **Fix** → Are all issues resolved?

---

## Shared Resources

- **AGENT.md** — Project overview and shared knowledge
- **plan.txt** — Business requirements

## Skills Per Agent

| Agent | Skills |
|-------|--------|
| **business-planner** | business context in AGENT.md, plan.txt |
| **software-architect** | [api-design](docs/skills/api-design.md) |
| **software-engineer** | [ui-ux-pro-max](docs/skills/ui-ux-pro-max/SKILL.md), [tailwind-design-system](docs/skills/tailwind-design-system.md) |
| **evaluator** | [code-review-quality](docs/skills/code-review-quality.md), [ui-ux-pro-max](docs/skills/ui-ux-pro-max/SKILL.md) |
| **fixer** | [debugging-troubleshooting](docs/skills/debugging-troubleshooting.md) |
