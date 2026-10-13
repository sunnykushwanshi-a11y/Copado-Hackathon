/**
 * Reporter — formats scan results as table or JSON
 */

import chalk from 'chalk';

const SEVERITY_COLORS = {
  critical: chalk.bgRed.white.bold,
  high: chalk.red.bold,
  medium: chalk.yellow,
  low: chalk.blue,
};

const SEVERITY_ICONS = {
  critical: '💀',
  high: '🔴',
  medium: '🟡',
  low: '🔵',
};

export function printTable(results) {
  const { summary, findings, filesScanned, elapsed, errors } = results;

  // Header
  console.log(chalk.gray(`  Scanned ${filesScanned} files in ${elapsed}ms\n`));

  // Summary bar
  console.log(
    '  ' +
    chalk.bgRed.white.bold(` ☠ ${summary.critical} CRITICAL `) + ' ' +
    chalk.red.bold(` 🔴 ${summary.high} HIGH `) + ' ' +
    chalk.yellow(` 🟡 ${summary.medium} MEDIUM `) + ' ' +
    chalk.blue(` 🔵 ${summary.low} LOW `) +
    chalk.gray(` — ${summary.total} total findings`)
  );

  console.log();

  if (findings.length === 0) {
    console.log(chalk.green('  No findings detected. Metadata looks clean!\n'));
    return;
  }

  // Group by severity
  const bySeverity = ['critical', 'high', 'medium', 'low'];
  for (const sev of bySeverity) {
    const group = findings.filter((f) => f.severity === sev);
    if (group.length === 0) continue;

    const icon = SEVERITY_ICONS[sev];
    const colorFn = SEVERITY_COLORS[sev];

    console.log(colorFn(`\n  ${icon} ${sev.toUpperCase()} (${group.length})`));
    console.log(chalk.gray('  ' + '─'.repeat(80)));

    for (const finding of group) {
      console.log(`\n  ${colorFn('●')} ${chalk.bold(finding.rule)}`);
      console.log(`    ${chalk.white(finding.message)}`);
      console.log(`    ${chalk.gray('File:')} ${chalk.cyan(finding.file)}${finding.line ? chalk.gray(`:${finding.line}`) : ''}`);
      console.log(`    ${chalk.gray('Fix: ')} ${chalk.green(finding.remediation)}`);
    }
  }

  // Errors
  if (errors.length > 0) {
    console.log(chalk.yellow(`\n  ⚠ ${errors.length} file(s) could not be scanned:`));
    for (const e of errors) {
      console.log(chalk.gray(`    ${e.file}: ${e.error}`));
    }
  }

  console.log();
}

export function printJson(results) {
  console.log(JSON.stringify(results, null, 2));
}
