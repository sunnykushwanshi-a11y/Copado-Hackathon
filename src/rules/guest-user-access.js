/**
 * Rule: Guest User Profile Access
 * Flags profiles/permsets that grant object or field access to unauthenticated (Guest) users
 */

export const guestUserAccessRule = {
  id: 'DG-007-GUEST-USER-ACCESS',
  description: 'Detects profiles or permission sets granting data access to Guest/unauthenticated users',
  severity: 'critical',
  category: 'security',
  check(content, filePath) {
    const findings = [];

    const isGuestProfile =
      filePath.toLowerCase().includes('guest') ||
      (filePath.endsWith('.profile-meta.xml') && /guestUser.*true|isGuest.*true/i.test(content));

    if (!isGuestProfile) return findings;

    // Check for object access granted to guests
    const objectAccessPattern = /<objectPermissions>[\s\S]*?<allowRead>true<\/allowRead>[\s\S]*?<\/objectPermissions>/gi;
    const fieldAccessPattern = /<fieldPermissions>[\s\S]*?<readable>true<\/readable>[\s\S]*?<\/fieldPermissions>/gi;

    const objectMatches = content.match(objectAccessPattern) || [];
    const fieldMatches = content.match(fieldAccessPattern) || [];

    if (objectMatches.length > 0) {
      findings.push({
        rule: guestUserAccessRule.id,
        severity: 'critical',
        category: 'security',
        file: filePath,
        line: null,
        message: `Guest user profile grants READ access to ${objectMatches.length} object(s) — unauthenticated users can access org data`,
        remediation:
          'Review all object permissions in the Guest User profile. Remove or restrict access to sensitive objects. Apply CRUD and FLS restrictions.',
      });
    }

    if (fieldMatches.length > 5) {
      findings.push({
        rule: guestUserAccessRule.id,
        severity: 'high',
        category: 'security',
        file: filePath,
        line: null,
        message: `Guest user profile exposes ${fieldMatches.length} field(s) — check for PII or sensitive data exposure`,
        remediation:
          'Audit field-level security in the Guest User profile. Ensure no PII, financial, or sensitive fields are accessible to unauthenticated users.',
      });
    }

    return findings;
  },
};
