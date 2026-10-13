/**
 * Rule: Hardcoded Production URLs
 * Detects hardcoded Salesforce org URLs, production endpoints, and environment-specific URLs
 */

export const hardcodedUrlRule = {
  id: 'DG-005-HARDCODED-URL',
  description: 'Detects hardcoded production URLs or org-specific endpoints in metadata',
  severity: 'medium',
  category: 'quality',
  check(content, filePath) {
    const findings = [];

    const patterns = [
      {
        pattern: /https:\/\/[a-z0-9-]+\.salesforce\.com\/[^\s'"<]+/gi,
        label: 'Hardcoded Salesforce org URL',
      },
      {
        pattern: /https:\/\/[a-z0-9-]+\.my\.salesforce\.com/gi,
        label: 'Hardcoded My Domain URL',
      },
      {
        pattern: /https:\/\/[a-z0-9-]+\.force\.com/gi,
        label: 'Hardcoded Force.com site URL',
      },
      {
        pattern: /https:\/\/[a-z0-9-]+-dev-ed\.salesforce\.com/gi,
        label: 'Hardcoded Developer Edition URL',
      },
    ];

    // Skip Named Credential and Remote Site Settings files (those are supposed to have URLs)
    if (
      filePath.includes('namedCredentials') ||
      filePath.includes('remoteSiteSettings') ||
      filePath.includes('cspTrustedSites')
    ) {
      return findings;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const { pattern, label } of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(lines[i])) {
          findings.push({
            rule: hardcodedUrlRule.id,
            severity: hardcodedUrlRule.severity,
            category: hardcodedUrlRule.category,
            file: filePath,
            line: i + 1,
            message: `${label} on line ${i + 1} — will break in other environments`,
            remediation: 'Use Named Credentials, Custom Labels, or Custom Metadata to store environment-specific URLs.',
          });
        }
      }
    }

    return findings;
  },
};
