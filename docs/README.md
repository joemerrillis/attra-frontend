# Frontend Documentation

Internal frontend documentation including architectural analysis, refactoring decisions, and API corrections.

---

## 📁 Directory Structure

```
docs/
├── analysis/       Internal architectural analysis and refactoring decisions
└── corrections/    API discrepancies and fixes we've identified
```

---

## 📊 analysis/

Internal documents analyzing proposed changes, refactors, and architectural decisions.

**Current Documents:**
- `REFACTOR_ANALYSIS.md` - Analysis of V1 campaign wizard refactor proposal
- `REFACTOR_ANALYSIS_V2.md` - Analysis of V2 campaign wizard refactor proposal

**Purpose:**
- Evaluate proposed architectural changes
- Document decision-making process
- Compare different implementation approaches
- Assess time estimates and complexity
- Risk analysis

---

## 🔧 corrections/

Documentation of API discrepancies, mismatches, and corrections needed.

**Current Documents:**
- `FRONTEND_API_CORRECTIONS.md` - Catalog of API endpoint mismatches between frontend expectations and backend implementation

**Purpose:**
- Track API contract violations
- Document HTTP method mismatches
- Record endpoint naming discrepancies
- Maintain list of fixes needed
- Reference during debugging

---

## 📝 When to Add Documents

### analysis/
- Evaluating a major refactor or architectural change
- Comparing multiple implementation approaches
- Documenting complex decision-making
- Assessing technical debt

### corrections/
- Found API mismatch (method, path, response shape)
- Discovered undocumented endpoint behavior
- Identified breaking changes in backend
- Cataloging bugs for future fixes

---

**Updated:** 2025-10-23
