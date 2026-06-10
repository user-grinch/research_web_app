# Project Cleanup and Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the project by removing unnecessary files and securing it with a root `.gitignore` before the initial commit.

**Architecture:** Surgical deletion of identified files followed by the creation of a comprehensive `.gitignore` and staging for git.

**Tech Stack:** Git, Shell commands.

---

### Task 1: Remove Unnecessary Files and Directories

**Files:**
- Delete: `.firebase/`
- Delete: `bigquery_sample.sql`
- Delete: `scripts/`

- [ ] **Step 1: Delete identified files and directories**

Run: `rm -rf .firebase/ bigquery_sample.sql scripts/`

- [ ] **Step 2: Verify deletion**

Run: `ls -a`
Expected: `.firebase/`, `bigquery_sample.sql`, and `scripts/` should not appear in the listing.

---

### Task 2: Create Root .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Write root .gitignore content**

```text
# Dependencies
node_modules/
/.pnp
.pnp.*

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Firebase
.firebase/
*-debug.log*
.firebaserc

# Environment files
.env*

# Misc
.DS_Store
*.pem
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

Run: `cat > .gitignore <<EOF
# Dependencies
node_modules/
/.pnp
.pnp.*

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Firebase
.firebase/
*-debug.log*
.firebaserc

# Environment files
.env*

# Misc
.DS_Store
*.pem
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF`

- [ ] **Step 2: Verify .gitignore existence**

Run: `ls -a .gitignore`
Expected: `.gitignore` exists.

---

### Task 3: Stage Files and Prepare Initial Commit

**Files:**
- Modify: Git index (stage files)

- [ ] **Step 1: Check git status to see what will be tracked**

Run: `git status`
Expected: Only relevant project files (web/, functions/, firebase.json, etc.) should be listed as untracked. No `.env`, `node_modules`, or `.firebase` should be present.

- [ ] **Step 2: Stage all files**

Run: `git add .`

- [ ] **Step 3: Verify staged files**

Run: `git status`
Expected: Files are staged and ready for commit.

- [ ] **Step 4: Propose initial commit**

Run: `git commit -m "initial commit: project cleanup and security setup"`
Note: Only run this if the user gives the final go-ahead or as part of the execution phase.
