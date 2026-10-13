/**
 * Scanner — walks the metadata directory, applies all rules, and returns results
 */

import { readFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import { RULES } from './rules/index.js';

const SCAN_PATTERNS = [
  '**/*.cls',
  '**/*.cls-meta.xml',
  '**/*.trigger',
  '**/*.trigger-meta.xml',
  '**/*.profile',
  '**/*.profile-meta.xml',
  '**/*.permissionset',
  '**/*.permissionset-meta.xml',
  '**/*.page',
  '**/*.page-meta.xml',
  '**/*.component-meta.xml',
  '**/*.lwc.js-meta.xml',
  '**/*.customMetadata',
  '**/*.labels-meta.xml',
  '**/*.namedCredential-meta.xml',
  '**/*.remoteSite-meta.xml',
  '**/*.flow-meta.xml',
];

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.sfdx/**',
  '**/.sf/**',
];

export async function runScan(rootPath) {
  const absRoot = path.resolve(rootPath);
  const startTime = Date.now();

  const files = await glob(SCAN_PATTERNS, {
    cwd: absRoot,
    ignore: IGNORE_PATTERNS,
    absolute: true,
    nodir: true,
  });

  const findings = [];
  const scannedFiles = [];
  const errors = [];

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      const relativePath = path.relative(absRoot, file);
      scannedFiles.push(relativePath);

      for (const rule of RULES) {
        if (typeof rule.check === 'function') {
          const ruleFindings = rule.check(content, relativePath);
          findings.push(...ruleFindings);
        }
      }
    } catch (err) {
      errors.push({ file, error: err.message });
    }
  }

  // Run post-checks for stateful rules (e.g., Apex coverage cross-file analysis)
  for (const rule of RULES) {
    if (typeof rule.postCheck === 'function') {
      const postFindings = rule.postCheck();
      findings.push(...postFindings);
    }
  }

  const elapsed = Date.now() - startTime;

  return {
    scannedAt: new Date().toISOString(),
    rootPath: absRoot,
    filesScanned: scannedFiles.length,
    elapsed,
    findings,
    errors,
    summary: {
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
      total: findings.length,
    },
  };
}
