# Project Cleanup and Security Setup

**Date:** 2026-06-11
**Topic:** Cleanup and Secret Management

## Goals
- Remove unnecessary build artifacts and sample files.
- Ensure secrets are not committed to GitHub.
- Prepare the project for its initial commit.

## Design

### 1. File Removal
The following files and directories will be deleted:
- `.firebase/`: Local build artifacts and caches.
- `bigquery_sample.sql`: Sample SQL script.
- `scripts/`: Directory containing utility scripts no longer needed.

### 2. Git Configuration
A root `.gitignore` will be created to ensure sensitive and unnecessary files are not tracked.
Key exclusions:
- `node_modules/`
- `.env*`
- `.next/`
- `.firebase/`
- `firebase-debug.log*`

### 3. Verification
- Verify that no `.env` files are tracked by git.
- Verify that the project still builds/runs if necessary (though this is primarily a cleanup task).

### 4. Initial Commit
- Stage all remaining files.
- Commit with a descriptive message.
