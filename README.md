# 🛡️ Agentia DeployGuard

> **Pre-deployment security & governance scanner for Copado Agentia™ CLI**

[![Agentia CLI](https://img.shields.io/badge/Agentia-CLI-7c3aed)](https://developer.copado.com/docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-≥18-green)](https://nodejs.org)

DeployGuard integrates with the **Agentia™ CLI** to intercept risky Salesforce metadata deployments *before* they reach production. It runs as a pre-flight scanner, an AI-powered risk reporter, and a native MCP tool for Cursor and VS Code — creating an intelligent security gate at every stage of the release pipeline.

---

## 🎯 The Problem

Salesforce teams routinely promote metadata with:
- **Hardcoded credentials** committed to version control
- **Dangerous profile permissions** (ModifyAllData, ViewAllData) silently enabled  
- **Outdated API versions** causing deprecated behavior
- **Apex classes without test coverage** that fail production deployments  
- **Guest User profiles** exposing sensitive org data to unauthenticated users

These issues only surface after deployment — as failed deployments, security incidents, or compliance violations.

**DeployGuard shifts this left** — catching problems in the developer's terminal, IDE, or CI pipeline, *before* `agentia cicd work push` is ever called.

---

## 🏗️ Architecture

```
Developer Workspace
│
├── Agentia CLI                  ← Core DevOps orchestration
│   └── agentia cicd work push   ← Promotion command
│
├── DeployGuard (this plugin)
│   ├── CLI (deployguard scan)   ← Terminal-first scanning
│   ├── MCP Server               ← IDE-native tools for Cursor/VS Code
│   └── Agent Skill              ← Playbook teaching AI agents the scan workflow
│
└── Rules Engine (7 rules)
    ├── DG-001  Credential Leak Detection      [CRITICAL]
    ├── DG-002  Profile Permission Escalation  [HIGH]
    ├── DG-003  API Version Compliance         [MEDIUM]
    ├── DG-004  Apex Test Coverage Signal      [MEDIUM]
    ├── DG-005  Hardcoded URL Detection        [MEDIUM]
    ├── DG-006  Admin Profile Modification     [HIGH]
    └── DG-007  Guest User Access Control      [CRITICAL]
```

---

## 🚀 Quick Start

```bash
# Install
npm install -g agentia-deployguard

# Scan your Salesforce project
deployguard scan

# Get AI-powered risk analysis
deployguard report

# Run the interactive demo (no Copado account needed)
npm run demo
```

---

## 📦 Installation & Integration

### 1. Standalone CLI

```bash
npm install agentia-deployguard
deployguard scan --path ./force-app --fail-on high
```

### 2. With Agentia CLI (Recommended)

```bash
# Install alongside Agentia CLI
npm install -g @copado/agentia-cli@beta agentia-deployguard

# Scan before promoting
deployguard scan && agentia cicd work push
```

### 3. MCP Integration (Cursor / VS Code)

Add to your project's `mcp.json`:

```json
{
  "mcpServers": {
    "deployguard": {
      "command": "node",
      "args": ["./node_modules/agentia-deployguard/src/mcp-server.js"]
    }
  }
}
```

Then start:
```bash
agentia mcp start
```

Your AI agent can now call `deployguard_scan`, `deployguard_summary`, and `deployguard_rules` natively.

### 4. Agent Skill (for coding agents)

```bash
# Copy the skill to your project for Cursor/Claude/other agents
cp node_modules/agentia-deployguard/skills/deployguard.agent.md .agentia/skills/
```

Or configure via `plugin.json` for automatic skill injection.

---

## 🔍 Rules Reference

| Rule | Severity | Category | Description |
|------|----------|----------|-------------|
| **DG-001** | 💀 CRITICAL | Security | Hardcoded passwords, API keys, tokens, secrets |
| **DG-002** | 🔴 HIGH | Governance | Profiles with ModifyAllData, ViewAllData, ManageUsers |
| **DG-003** | 🟡 MEDIUM | Quality | API versions below 57.0 (warn) or 50.0 (block) |
| **DG-004** | 🟡 MEDIUM | Quality | Apex classes without a paired `@isTest` class |
| **DG-005** | 🟡 MEDIUM | Quality | Hardcoded org URLs that break in other environments |
| **DG-006** | 🔴 HIGH | Governance | Any modification to the System Administrator profile |
| **DG-007** | 💀 CRITICAL | Security | Guest User profiles granting object/field data access |

---

## 🖥️ CLI Reference

```bash
# Scan with table output (default)
deployguard scan

# Scan with JSON output (for CI/automation)
deployguard scan --format json

# Only block on CRITICAL (more permissive gate)
deployguard scan --fail-on critical

# Scan a specific project directory  
deployguard scan --path /path/to/sfdx-project

# Get AI prompt for risk analysis
deployguard report

# List all active rules
deployguard rules list
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Scan passed — no findings at or above the `--fail-on` threshold |
| `1` | Scan failed — one or more blocking findings detected |

---

## 🤖 MCP Tools

When the MCP server is running, the following tools are available to AI agents:

| Tool | Description |
|------|-------------|
| `deployguard_scan` | Full scan — returns structured JSON with all findings |
| `deployguard_summary` | Plain-text summary — ideal for `agentia ai agent ask` prompts |
| `deployguard_rules` | List all active governance rules |

---

## 🔗 Agentia CLI Integration

DeployGuard is designed to slot cleanly into the Agentia workflow:

```bash
# Recommended pre-promotion workflow
agentia cicd work set <story-id>        # 1. Set work item
deployguard scan --fail-on high         # 2. Security gate (DeployGuard)
agentia cicd work push                  # 3. Promote only if scan passes
agentia cicd promote                    # 4. Promote to next environment
```

Use the Agent Skill to teach your coding agent (Cursor, Claude, etc.) to always run Step 2 before Step 3.

---

## 📊 Example Output

```
🔍 Agentia DeployGuard — Running pre-deployment scan...

  Scanned 12 files in 43ms

  ☠ 2 CRITICAL  🔴 3 HIGH  🟡 4 MEDIUM  🔵 0 LOW — 9 total findings

  💀 CRITICAL (2)
  ──────────────────────────────────────────────────────────────
  ● DG-001-CREDENTIAL-LEAK
    Hardcoded API key detected on line 3
    File: force-app/main/default/classes/PaymentService.cls:3
    Fix:  Use Named Credentials or Custom Metadata. Never hardcode secrets.

  ● DG-007-GUEST-USER-ACCESS
    Guest user profile grants READ access to 4 object(s)
    File: force-app/main/default/profiles/SiteGuest.profile-meta.xml
    Fix:  Remove object permissions from Guest User profile.

❌ Scan FAILED — findings at or above "high" severity detected.
💡 Fix issues above before running: agentia cicd work push
```

---

## 🎬 Demo

No Copado account needed:

```bash
npm run demo
```

Creates intentionally flawed mock metadata and shows DeployGuard catching all 7 rule types.

---

## 📁 Project Structure

```
agentia-deployguard/
├── src/
│   ├── cli.js              ← CLI entry point (scan, report, rules)
│   ├── scanner.js          ← File walker + rule orchestrator
│   ├── reporter.js         ← Table + JSON output formatters
│   ├── mcp-server.js       ← MCP server (IDE integration)
│   ├── demo.js             ← Demo script with mock metadata
│   └── rules/
│       ├── index.js                ← Rules registry
│       ├── credential-leak.js      ← DG-001
│       ├── profile-permissions.js  ← DG-002
│       ├── api-version.js          ← DG-003
│       ├── apex-without-test.js    ← DG-004
│       ├── hardcoded-url.js        ← DG-005
│       ├── admin-profile-mod.js    ← DG-006
│       └── guest-user-access.js    ← DG-007
├── skills/
│   └── deployguard.agent.md    ← Agentia Agent Skill playbook
├── .github/
│   └── plugin.json             ← Agentia plugin manifest
└── package.json
```

---

## 🔮 Extending DeployGuard

Add custom rules by creating a new file in `src/rules/` and registering it in `src/rules/index.js`:

```javascript
// src/rules/my-custom-rule.js
export const myRule = {
  id: 'DG-CUSTOM-001',
  description: 'My custom governance rule',
  severity: 'high',      // low | medium | high | critical
  category: 'security',  // security | governance | quality
  check(content, filePath) {
    const findings = [];
    if (content.includes('DANGER')) {
      findings.push({
        rule: myRule.id,
        severity: myRule.severity,
        category: myRule.category,
        file: filePath,
        line: 1,
        message: 'Found DANGER keyword',
        remediation: 'Remove the DANGER keyword.',
      });
    }
    return findings;
  },
};
```

---

## 🏆 Hackathon Submission

**Challenge:** Copado Agentia™ CLI Headless Virtual Hackathon 2026

**Challenge directions addressed:**
- ✅ Strengthen quality, security, or governance through validation, policy checks, and risk detection
- ✅ Automate a repetitive or complex workflow
- ✅ Connect Agentia CLI with other tools (MCP, IDE agents)
- ✅ Simplify troubleshooting and provide intelligent recommendations
- ✅ Create reusable templates (Agent Skills) for consistent standards
- ✅ Enable event-driven workflows (pre-push hooks)
- ✅ Improve the overall developer experience

---

## 📄 License

MIT © 2026
