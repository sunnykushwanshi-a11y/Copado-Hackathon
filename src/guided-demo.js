/**
 * Agentia DeployGuard — Full Guided Demo Script
 * Run this while screen recording. It narrates and executes everything.
 * Usage: node src/guided-demo.js
 */

import { writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { runScan } from './scanner.js';
import { printTable } from './reporter.js';
import chalk from 'chalk';
import { RULES } from './rules/index.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function line(char = '─', len = 72) {
  return chalk.gray(char.repeat(len));
}

function section(title) {
  console.log('\n' + line());
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(line() + '\n');
}

function narrate(text) {
  console.log(chalk.italic.gray(`  💬  ${text}`));
}

async function typeEffect(text, color = 'white', delay = 18) {
  process.stdout.write('  ');
  for (const ch of text) {
    process.stdout.write(chalk[color](ch));
    await sleep(delay);
  }
  process.stdout.write('\n');
}

// ─── MOCK FILES ──────────────────────────────────────────────────
const DEMO_DIR = './demo-metadata';

const MOCK_FILES = {
  'force-app/main/default/classes/PaymentService.cls': `
public class PaymentService {
    private static final String API_KEY = 'sk-prod-abc123secret456xyz';
    private static final String password = 'MyProdP@ssword123';
    private static final String endpoint = 'https://mycompany.salesforce.com/services/data/v45.0';
    public static void processPayment(String amount) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint + '/payment');
        req.setHeader('Authorization', 'Bearer ' + API_KEY);
    }
}`,
  'force-app/main/default/classes/PaymentService.cls-meta.xml': `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>45.0</apiVersion>
    <status>Active</status>
</ApexClass>`,
  'force-app/main/default/profiles/CustomAdmin.profile-meta.xml': `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <userPermissions>
        <enabled>true</enabled>
        <name>ModifyAllData</name>
    </userPermissions>
    <userPermissions>
        <enabled>true</enabled>
        <name>ViewAllData</name>
    </userPermissions>
</Profile>`,
  'force-app/main/default/profiles/Admin.profile-meta.xml': `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <custom>false</custom>
    <userPermissions>
        <enabled>true</enabled>
        <name>ModifyAllData</name>
    </userPermissions>
</Profile>`,
  'force-app/main/default/classes/InvoiceGenerator.cls': `
public class InvoiceGenerator {
    public static String generateInvoice(Id orderId) {
        return 'INV-' + orderId;
    }
}`,
  'force-app/main/default/classes/InvoiceGenerator.cls-meta.xml': `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <status>Active</status>
</ApexClass>`,
  'force-app/main/default/classes/AccountHelper.cls': `
public class AccountHelper {
    public static List<Account> getTopAccounts() {
        return [SELECT Id, Name FROM Account LIMIT 10];
    }
}`,
  'force-app/main/default/classes/AccountHelperTest.cls': `
@isTest
public class AccountHelperTest {
    @isTest
    static void testGetTopAccounts() {
        List<Account> result = AccountHelper.getTopAccounts();
        System.assertNotEquals(null, result);
    }
}`,
};

// ════════════════════════════════════════════════════════════════
async function main() {
  console.clear();
  await sleep(400);

  // ── INTRO ──────────────────────────────────────────────────────
  console.log('\n' + line('═'));
  console.log(chalk.bold.cyan('  🛡️  Agentia DeployGuard  —  Live Demo'));
  console.log(chalk.gray('  Pre-Deployment Security & Governance Scanner for Copado Agentia™ CLI'));
  console.log(line('═') + '\n');
  await sleep(1500);

  narrate('DeployGuard prevents risky Salesforce metadata from reaching production.');
  narrate('It works as a CLI tool, an MCP server, and an Agentia Agent Skill.');
  await sleep(2000);

  // ── STEP 1 — SHOW RULES ────────────────────────────────────────
  section('STEP 1 — Active Governance Rules');
  narrate('First, let\'s see all 7 built-in governance rules...');
  await sleep(1200);

  const severityColor = { critical: 'red', high: 'redBright', medium: 'yellow', low: 'blue' };
  const severityIcon  = { critical: '💀 CRITICAL', high: '🔴 HIGH    ', medium: '🟡 MEDIUM  ', low: '🔵 LOW     ' };

  for (const rule of RULES) {
    const col = severityColor[rule.severity] || 'white';
    const icon = severityIcon[rule.severity];
    console.log(
      `  ${chalk[col](icon)}  ${chalk.bold(rule.id.padEnd(32))}  ${chalk.gray(rule.description.substring(0, 50) + '...')}`
    );
    await sleep(250);
  }

  await sleep(1500);
  narrate('Each rule covers a different attack surface. All run automatically on every scan.');
  await sleep(1800);

  // ── STEP 2 — CREATE MOCK METADATA ──────────────────────────────
  section('STEP 2 — Setting Up Vulnerable Salesforce Project');
  narrate('We\'re creating a mock SFDX project with intentional security issues...');
  await sleep(1000);

  for (const [relPath, content] of Object.entries(MOCK_FILES)) {
    const fullPath = join(DEMO_DIR, relPath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content.trim(), 'utf8');
    console.log(chalk.green(`  ✓ Created  `) + chalk.cyan(relPath));
    await sleep(120);
  }

  await sleep(1200);
  console.log();
  narrate('Project ready. A developer is about to push this to production via Agentia CLI...');
  await sleep(1500);

  // ── STEP 3 — SIMULATE AGENTIA WORK PUSH ───────────────────────
  section('STEP 3 — Developer Runs: agentia cicd work push');
  narrate('Without DeployGuard, this command would silently promote all vulnerabilities.');
  await sleep(1000);

  console.log(chalk.gray('  $ ') + chalk.white('agentia cicd work push'));
  await sleep(600);
  console.log(chalk.yellow('  ⏳  DeployGuard pre-push hook triggered...'));
  await sleep(1000);
  console.log(chalk.yellow('  ⏳  Running security gate before promotion...\n'));
  await sleep(1500);

  // ── STEP 4 — RUN THE SCAN ──────────────────────────────────────
  section('STEP 4 — DeployGuard Scan Running');
  narrate('Scanning all Salesforce metadata files for security and governance violations...');
  await sleep(800);

  console.log(chalk.bold.cyan('  🔍 Agentia DeployGuard — Scanning metadata...\n'));

  const results = await runScan(DEMO_DIR);
  printTable(results);

  await sleep(2000);

  // ── STEP 5 — EXPLAIN KEY FINDINGS ─────────────────────────────
  section('STEP 5 — Key Findings Explained');

  narrate('CRITICAL: DG-001 — PaymentService.cls has a hardcoded API key on line 2.');
  await sleep(600);
  console.log(chalk.red('  ☠  This credential could be extracted from the repo and used to access production systems.'));
  await sleep(1600);

  narrate('CRITICAL: DG-001 — Also has a hardcoded password. Two secrets in one file.');
  await sleep(600);
  console.log(chalk.red('  ☠  Fix: Replace with Named Credentials or Custom Metadata.'));
  await sleep(1600);

  narrate('HIGH: DG-002 — CustomAdmin profile has ModifyAllData AND ViewAllData enabled.');
  await sleep(600);
  console.log(chalk.redBright('  🔴  This allows any user with this profile to edit or read every record in the org.'));
  await sleep(1600);

  narrate('HIGH: DG-006 — The System Administrator profile itself is being modified.');
  await sleep(600);
  console.log(chalk.redBright('  🔴  Admin profile changes require explicit security owner approval.'));
  await sleep(1600);

  narrate('MEDIUM: DG-003 — API version 45.0 is below minimum supported (50.0).');
  await sleep(600);
  console.log(chalk.yellow('  🟡  Salesforce may have retired this API. Update to v62.0.'));
  await sleep(1600);

  narrate('MEDIUM: DG-004 — PaymentService and InvoiceGenerator have no test classes in this deployment.');
  await sleep(600);
  console.log(chalk.yellow('  🟡  Salesforce requires 75% code coverage to deploy to production.'));
  await sleep(1800);

  // ── STEP 6 — DEPLOYMENT BLOCKED ───────────────────────────────
  section('STEP 6 — Deployment Decision');
  narrate('DeployGuard evaluates the threshold. Default: block on HIGH or above.');
  await sleep(1200);

  const blocked = results.summary.critical > 0 || results.summary.high > 0;

  if (blocked) {
    console.log(chalk.red.bold('  ❌  DEPLOYMENT BLOCKED'));
    console.log(chalk.red(`      ${results.summary.critical} CRITICAL + ${results.summary.high} HIGH findings exceed the threshold.`));
    await sleep(1000);
    console.log(chalk.yellow('\n  💡  agentia cicd work push was NOT executed.'));
    console.log(chalk.yellow('  💡  Fix the issues above and re-run the scan to proceed.\n'));
  } else {
    console.log(chalk.green.bold('  ✅  DEPLOYMENT APPROVED — agentia cicd work push can proceed.'));
  }

  await sleep(2000);

  // ── STEP 7 — AI REPORT ────────────────────────────────────────
  section('STEP 7 — AI Risk Report (for agentia ai agent ask)');
  narrate('DeployGuard can also generate a prompt for Agentia\'s AI agent to analyse risk...');
  await sleep(1000);

  console.log(chalk.gray('  $ ') + chalk.white('node src/cli.js report'));
  await sleep(600);
  console.log();
  const prompt = [
    `I'm about to promote Salesforce metadata to production. DeployGuard found:`,
    `  - Critical: ${results.summary.critical} finding(s)`,
    `  - High:     ${results.summary.high} finding(s)`,
    `  - Medium:   ${results.summary.medium} finding(s)`,
    ``,
    `Top findings:`,
    `  [CRITICAL] DG-001: Hardcoded API key in PaymentService.cls`,
    `  [CRITICAL] DG-001: Hardcoded password in PaymentService.cls`,
    `  [HIGH]     DG-002: ModifyAllData enabled in CustomAdmin profile`,
    ``,
    `Please assess deployment risk and recommend whether to proceed.`,
  ].join('\n');

  for (const l of prompt.split('\n')) {
    console.log(chalk.gray('  ') + chalk.white(l));
    await sleep(80);
  }

  await sleep(1000);
  console.log();
  narrate('This prompt is piped directly to: agentia ai agent ask "..."');
  console.log(chalk.gray('  $ ') + chalk.white('agentia ai agent ask "$(node src/cli.js report)"'));
  await sleep(2000);

  // ── STEP 8 — MCP TOOLS ────────────────────────────────────────
  section('STEP 8 — MCP Server (Cursor / VS Code Integration)');
  narrate('DeployGuard also runs as an MCP server so AI agents can call it natively from the IDE.');
  await sleep(1000);

  console.log(chalk.gray('  $ ') + chalk.white('node src/mcp-server.js'));
  await sleep(400);
  console.log(chalk.green('  ✓  MCP server started on stdio'));
  console.log(chalk.gray('\n  Available MCP tools:'));
  await sleep(600);
  console.log(chalk.cyan('    deployguard_scan      ') + chalk.gray('→ Full scan with structured JSON results'));
  await sleep(300);
  console.log(chalk.cyan('    deployguard_summary   ') + chalk.gray('→ Plain-text summary for AI prompts'));
  await sleep(300);
  console.log(chalk.cyan('    deployguard_rules     ') + chalk.gray('→ List all active governance rules'));
  await sleep(1800);

  // ── STEP 9 — AGENT SKILL ──────────────────────────────────────
  section('STEP 9 — Agentia Agent Skill');
  narrate('The deployguard.agent.md skill teaches Cursor/Claude to always scan before promoting.');
  await sleep(1000);

  console.log(chalk.gray('  $ ') + chalk.white('agentia setup skills create --target cursor --no-prompt'));
  await sleep(500);
  console.log(chalk.green('  ✓  Skill installed: skills/deployguard.agent.md'));
  await sleep(600);
  console.log(chalk.gray('\n  When a coding agent runs agentia cicd work push, the skill enforces:'));
  await sleep(400);
  const steps = [
    '  1. Run deployguard scan',
    '  2. If CRITICAL/HIGH → stop and report findings',
    '  3. If PASSED → proceed with agentia cicd work push',
    '  4. On failure → get AI analysis via agentia ai agent ask',
  ];
  for (const s of steps) {
    console.log(chalk.yellow(s));
    await sleep(400);
  }

  await sleep(2000);

  // ── STEP 10 — CLOSING ─────────────────────────────────────────
  section('STEP 10 — Summary');
  await sleep(500);

  console.log(chalk.bold('  Agentia DeployGuard caught:'));
  await sleep(400);
  console.log(chalk.red(`    ☠  ${results.summary.critical} CRITICAL  — credential leaks, guest access`));
  await sleep(300);
  console.log(chalk.redBright(`    🔴  ${results.summary.high} HIGH      — dangerous permissions, admin profile`));
  await sleep(300);
  console.log(chalk.yellow(`    🟡  ${results.summary.medium} MEDIUM    — outdated API, missing tests, hardcoded URLs`));
  await sleep(600);
  console.log();
  console.log(chalk.bold.green('  All of this — BEFORE a single file reached production.'));
  await sleep(1200);
  console.log();
  narrate('DeployGuard is open source and extensible. Add a custom rule in 20 lines of JS.');
  await sleep(800);
  narrate('Built for the Copado Agentia CLI Hackathon 2026.');
  await sleep(800);
  console.log();
  console.log(line('═'));
  console.log(chalk.bold.cyan('  🔗  github.com/sunnykushwanshi-a11y/Copado-Hackathon'));
  console.log(chalk.bold.cyan('  🛡️  Agentia DeployGuard — Stop shipping risk. Start shipping confidence.'));
  console.log(line('═') + '\n');

  // Cleanup
  await rm(DEMO_DIR, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(chalk.red('\nDemo error:', err.message));
  process.exit(1);
});
