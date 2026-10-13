/**
 * Rule: Outdated Salesforce API Version
 * Flags metadata using deprecated or sunset API versions
 */

const CURRENT_API_VERSION = 62.0;
const MINIMUM_SUPPORTED = 50.0;
const WARN_BELOW = 57.0;

export const apiVersionRule = {
  id: 'DG-003-API-VERSION',
  description: `Flags Apex/component API versions below ${WARN_BELOW} (outdated) or below ${MINIMUM_SUPPORTED} (unsupported)`,
  severity: 'medium',
  category: 'quality',
  check(content, filePath) {
    const findings = [];
    const isApexOrLwc =
      filePath.endsWith('.cls-meta.xml') ||
      filePath.endsWith('.trigger-meta.xml') ||
      filePath.endsWith('.component-meta.xml') ||
      filePath.endsWith('.page-meta.xml') ||
      filePath.endsWith('.lwc.js-meta.xml');

    if (!isApexOrLwc) return findings;

    const match = content.match(/<apiVersion>([\d.]+)<\/apiVersion>/);
    if (match) {
      const version = parseFloat(match[1]);

      if (version < MINIMUM_SUPPORTED) {
        findings.push({
          rule: apiVersionRule.id,
          severity: 'high',
          category: apiVersionRule.category,
          file: filePath,
          line: null,
          message: `API version ${version} is BELOW the minimum supported version (${MINIMUM_SUPPORTED}). Salesforce may have retired it.`,
          remediation: `Update <apiVersion> to ${CURRENT_API_VERSION} and retest all functionality.`,
        });
      } else if (version < WARN_BELOW) {
        findings.push({
          rule: apiVersionRule.id,
          severity: 'medium',
          category: apiVersionRule.category,
          file: filePath,
          line: null,
          message: `API version ${version} is outdated (current: ${CURRENT_API_VERSION}). New features and fixes may be unavailable.`,
          remediation: `Consider upgrading to API version ${CURRENT_API_VERSION} to benefit from the latest platform improvements.`,
        });
      }
    }

    return findings;
  },
};
