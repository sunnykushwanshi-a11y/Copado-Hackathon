# Agentia DeployGuard Skill
# Agent Playbook: Pre-Deployment Security & Governance Scanner

> **Purpose**: This skill teaches you how to use **Agentia DeployGuard** to scan Salesforce metadata for security vulnerabilities and governance violations *before* promoting changes via Agentia CLI. Run this skill before every `agentia cicd work push`.

---

## When to Use This Skill

Run DeployGuard before **any** of these Agentia CLI operations:
- `agentia cicd work push`
- `agentia cicd promote`
- `agentia cicd deploy`
- Any time you're about to promote to a higher environment (QA → UAT → Prod)

---

## Workflow

### Step 1 — Run the Security Scan

```bash
deployguard scan --path . --format table --fail-on high
```

Or via the shorthand npm script:
```bash
npm run scan
```

**What it checks:**
| Rule ID | Severity | What It Detects |
|---|---|---|
| DG-001-CREDENTIAL-LEAK | 🔴 CRITICAL | Hardcoded passwords, API keys, tokens |
| DG-002-PROFILE-PERMISSIONS | 🔴 HIGH | Dangerous profile permissions (ModifyAllData, etc.) |
| DG-003-API-VERSION | 🟡 MEDIUM | Outdated/unsupported Salesforce API versions |
| DG-004-APEX-NO-TEST | 🟡 MEDIUM | Apex classes without paired test classes |
| DG-005-HARDCODED-URL | 🟡 MEDIUM | Hardcoded org-specific URLs |
| DG-006-ADMIN-PROFILE-MOD | 🔴 HIGH | System Administrator profile changes |
| DG-007-GUEST-USER-ACCESS | 🔴 CRITICAL | Guest user data access |

---

### Step 2 — Interpret Results

**If scan PASSES (exit code 0):**
```
✅ Scan PASSED — no blocking findings detected.
```
→ Proceed to Step 4.

**If scan FAILS (exit code 1):**
```
❌ Scan FAILED — findings at or above "high" severity detected.
```
→ Go to Step 3 before proceeding.

---

### Step 3 — Get AI-Powered Risk Analysis (on failure)

Generate a structured prompt and pass it to the Agentia AI agent:

```bash
deployguard report
```

This outputs a prompt you can pipe directly to Agentia:

```bash
agentia ai agent ask "$(node src/cli.js report 2>&1 | tail -20)"
```

Or via MCP (if server is running):
- Use the `deployguard_summary` MCP tool
- Then ask the AI agent to assess risk and recommend remediation steps

---

### Step 4 — Remediate Findings

Follow the remediation guidance printed for each finding:

- **DG-001 (Credentials)**: Replace with Named Credentials or Custom Metadata
- **DG-002 (Profile Perms)**: Remove dangerous permissions; use Permission Sets instead
- **DG-003 (API Version)**: Update `<apiVersion>` in metadata XML to current version (62.0)
- **DG-004 (No Tests)**: Create `<ClassName>Test.cls` with `@isTest` annotation
- **DG-005 (URLs)**: Move to Custom Labels or Named Credentials
- **DG-006 (Admin Profile)**: Get explicit approval before deploying admin profile changes
- **DG-007 (Guest Access)**: Remove object/field permissions from Guest User profile

---

### Step 5 — Re-scan and Promote

After remediating, re-run the scan to confirm all blockers are resolved:

```bash
deployguard scan && agentia cicd work push
```

---

## Using DeployGuard with Agentia MCP

If you have the MCP server running (`npm run mcp`), you can invoke DeployGuard tools directly:

| MCP Tool | Description |
|---|---|
| `deployguard_scan` | Full scan with structured JSON results |
| `deployguard_summary` | Plain-text risk summary for AI prompts |
| `deployguard_rules` | List all active rules |

---

## Configuration

Add to `mcp.json` in your project root to expose via `agentia mcp start`:

```json
{
  "mcpServers": {
    "deployguard": {
      "command": "node",
      "args": ["./node_modules/agentia-deployguard/src/mcp-server.js"],
      "description": "Pre-deployment security & governance scanner"
    }
  }
}
```

---

## Guardrails

- **Never** run `agentia cicd work push` if DeployGuard reports CRITICAL findings
- **Always** get security owner approval before overriding HIGH findings  
- **Do not** use `--fail-on critical` in production pipelines — HIGH should be the minimum gate
- DeployGuard is a **pre-flight check**, not a substitute for Copado's built-in quality gates

---

## Quick Reference

```bash
# Install
npm install -g agentia-deployguard

# Scan current directory
deployguard scan

# Scan specific path, output JSON (for CI pipelines)
deployguard scan --path ./force-app --format json --fail-on high

# Get AI risk report
deployguard report

# List all rules
deployguard rules

# Start MCP server (for IDE integration)
node src/mcp-server.js
```
