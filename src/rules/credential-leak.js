/**
 * Rule: Credential Leak Detection
 * Detects hardcoded passwords, API keys, tokens, secrets in metadata files
 */

export const credentialLeakRule = {
  id: 'DG-001-CREDENTIAL-LEAK',
  description: 'Detects hardcoded credentials, passwords, API keys, or secrets in metadata',
  severity: 'critical',
  category: 'security',
  check(content, filePath) {
    const findings = [];

    const patterns = [
      { pattern: /password\s*=\s*['"][^'"]{4,}['"]/gi, label: 'Hardcoded password' },
      { pattern: /api[_-]?key\s*[=:]\s*['"][A-Za-z0-9\-_.]{10,}['"]/gi, label: 'Hardcoded API key' },
      { pattern: /secret\s*[=:]\s*['"][A-Za-z0-9\-_.@#$%]{8,}['"]/gi, label: 'Hardcoded secret' },
      { pattern: /access[_-]?token\s*[=:]\s*['"][A-Za-z0-9\-_.]{10,}['"]/gi, label: 'Hardcoded access token' },
      { pattern: /private[_-]?key\s*[=:]\s*['"][^'"]{10,}['"]/gi, label: 'Hardcoded private key' },
      { pattern: /client[_-]?secret\s*[=:]\s*['"][A-Za-z0-9\-_.]{8,}['"]/gi, label: 'Hardcoded client secret' },
      // Salesforce-specific
      { pattern: /00D[A-Za-z0-9]{12,}/g, label: 'Possible Salesforce Org ID exposed' },
      { pattern: /SFMC_[A-Z_]+\s*=\s*['"][^'"]{6,}['"]/gi, label: 'SFMC credential' },
    ];

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const { pattern, label } of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(lines[i])) {
          findings.push({
            rule: credentialLeakRule.id,
            severity: credentialLeakRule.severity,
            category: credentialLeakRule.category,
            file: filePath,
            line: i + 1,
            message: `${label} detected on line ${i + 1}`,
            remediation: 'Use Named Credentials, Custom Metadata, or environment variables. Never hardcode secrets in metadata.',
          });
        }
      }
    }

    return findings;
  },
};
