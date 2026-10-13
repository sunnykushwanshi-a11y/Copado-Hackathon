#!/usr/bin/env node
/**
 * Agentia DeployGuard — CLI entry point
 * 
 * Usage:
 *   deployguard scan [--path <dir>] [--format json|table] [--fail-on high]
 *   deployguard report
 *   deployguard rules list
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { runScan } from './scanner.js';
import { printTable, printJson } from './reporter.js';
import { RULES } from './rules/index.js';

const program = new Command();

program
  .name('deployguard')
  .description(
    chalk.bold('Agentia DeployGuard') +
    ' — Pre-deployment security & governance scanner\n' +
    'Scans Salesforce metadata for risks before promotion via Agentia CLI'
  )
  .version('1.0.0');

// ─── SCAN ────────────────────────────────────────────────────────────────────
program
  .command('scan')
  .description('Scan metadata directory for security and governance issues')
  .option('-p, --path <dir>', 'Path to Salesforce metadata (SFDX project or mdapi)', process.cwd())
  .option('-f, --format <fmt>', 'Output format: table | json', 'table')
  .option('--fail-on <severity>', 'Exit code 1 if any finding >= severity (low|medium|high|critical)', 'high')
  .option('--no-color', 'Disable colored output')
  .action(async (opts) => {
    console.log(chalk.bold.cyan('\n🔍 Agentia DeployGuard — Running pre-deployment scan...\n'));

    const results = await runScan(opts.path);

    if (opts.format === 'json') {
      printJson(results);
    } else {
      printTable(results);
    }

    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const threshold = severityOrder.indexOf(opts.failOn);
    const hasBreach = results.findings.some(
      (f) => severityOrder.indexOf(f.severity) >= threshold
    );

    if (hasBreach) {
      console.log(chalk.red.bold(`\n❌ Scan FAILED — findings at or above "${opts.failOn}" severity detected.`));
      console.log(chalk.yellow('💡 Fix issues above before running: agentia cicd work push\n'));
      process.exit(1);
    } else {
      console.log(chalk.green.bold('\n✅ Scan PASSED — no blocking findings detected.\n'));
    }
  });

// ─── REPORT ──────────────────────────────────────────────────────────────────
program
  .command('report')
  .description('Generate an AI-powered risk summary (requires agentia CLI)')
  .option('-p, --path <dir>', 'Path to metadata', process.cwd())
  .action(async (opts) => {
    const results = await runScan(opts.path);

    const summary = buildPromptSummary(results);
    console.log(chalk.cyan.bold('\n📋 Risk Summary for AI Agent:\n'));
    console.log(summary);
    console.log(chalk.gray('\n─────────────────────────────────────────────────────'));
    console.log(chalk.yellow('To get an AI analysis, run:'));
    console.log(chalk.white(`  agentia ai agent ask "${summary.replace(/\n/g, ' ').substring(0, 200)}..."`));
    console.log(chalk.gray('─────────────────────────────────────────────────────\n'));
  });

// ─── RULES ───────────────────────────────────────────────────────────────────
program
  .command('rules')
  .description('List all active governance rules')
  .action(() => {
    console.log(chalk.bold.cyan('\n📏 Active DeployGuard Rules:\n'));
    for (const rule of RULES) {
      const color = { low: 'green', medium: 'yellow', high: 'red', critical: 'magenta' }[rule.severity];
      console.log(
        `  ${chalk[color]('●')} ${chalk.bold(rule.id.padEnd(30))} [${chalk[color](rule.severity.toUpperCase())}]`
      );
      console.log(`    ${chalk.gray(rule.description)}\n`);
    }
  });

program.parse();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function buildPromptSummary(results) {
  const critical = results.findings.filter((f) => f.severity === 'critical');
  const high = results.findings.filter((f) => f.severity === 'high');
  const medium = results.findings.filter((f) => f.severity === 'medium');
  const low = results.findings.filter((f) => f.severity === 'low');

  return [
    `I'm about to promote Salesforce metadata to production. DeployGuard found the following issues:`,
    `- Critical: ${critical.length} finding(s)`,
    `- High: ${high.length} finding(s)`,
    `- Medium: ${medium.length} finding(s)`,
    `- Low: ${low.length} finding(s)`,
    '',
    critical.concat(high).slice(0, 5).map((f) =>
      `[${f.severity.toUpperCase()}] ${f.rule} in ${f.file}: ${f.message}`
    ).join('\n'),
    '',
    'Please assess the deployment risk, explain the potential impact of each high/critical finding, and recommend whether to proceed or remediate first.',
  ].join('\n');
}
