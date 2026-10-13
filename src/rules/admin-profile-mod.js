/**
 * Rule: System Administrator Profile Modification
 * Flags changes to the System Administrator profile — always requires strict review
 */

export const adminProfileModRule = {
  id: 'DG-006-ADMIN-PROFILE-MOD',
  description: 'Detects modifications to the System Administrator profile — requires explicit review',
  severity: 'high',
  category: 'governance',
  check(content, filePath) {
    const findings = [];

    const isAdminProfile =
      filePath.toLowerCase().includes('admin.profile') ||
      filePath.toLowerCase().includes('system administrator.profile') ||
      filePath.toLowerCase().includes('systemadministrator.profile');

    if (!isAdminProfile) return findings;

    findings.push({
      rule: adminProfileModRule.id,
      severity: adminProfileModRule.severity,
      category: adminProfileModRule.category,
      file: filePath,
      line: null,
      message: 'The System Administrator profile is being MODIFIED in this deployment',
      remediation:
        'System Administrator profile changes must be reviewed by a security owner. Confirm all permission changes are intentional and approved.',
    });

    return findings;
  },
};
