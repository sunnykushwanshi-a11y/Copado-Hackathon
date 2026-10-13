/**
 * Rule: Profile Permission Escalation
 * Flags profiles that grant dangerous system permissions
 */

export const profilePermissionsRule = {
  id: 'DG-002-PROFILE-PERMISSIONS',
  description: 'Detects profiles granting dangerous system-level permissions (ModifyAllData, ViewAllData, etc.)',
  severity: 'high',
  category: 'governance',
  check(content, filePath) {
    const findings = [];
    if (!filePath.endsWith('.profile') && !filePath.endsWith('.profile-meta.xml')) return findings;

    const dangerousPermissions = [
      { perm: 'ModifyAllData', reason: 'Allows user to edit all records in the org — catastrophic if misused' },
      { perm: 'ViewAllData', reason: 'Allows user to view all records bypassing sharing rules' },
      { perm: 'ManageUsers', reason: 'Allows user management — risk of privilege escalation' },
      { perm: 'ResetPasswords', reason: 'Can reset any user password — account takeover risk' },
      { perm: 'InstallPackaging', reason: 'Can install AppExchange packages — supply chain risk' },
      { perm: 'ManageAuthProviders', reason: 'Can configure SSO/OAuth — authentication bypass risk' },
    ];

    for (const { perm, reason } of dangerousPermissions) {
      // Match <userPermission><enabled>true</enabled><name>ModifyAllData</name> patterns
      const regex = new RegExp(
        `<userPermission>[\\s\\S]*?<enabled>true<\\/enabled>[\\s\\S]*?<name>${perm}<\\/name>|` +
        `<name>${perm}<\\/name>[\\s\\S]*?<enabled>true<\\/enabled>`,
        'gi'
      );
      if (regex.test(content)) {
        findings.push({
          rule: profilePermissionsRule.id,
          severity: profilePermissionsRule.severity,
          category: profilePermissionsRule.category,
          file: filePath,
          line: null,
          message: `Dangerous permission "${perm}" is ENABLED — ${reason}`,
          remediation: `Review whether this profile needs "${perm}". Consider using a more restrictive profile or permission set.`,
        });
      }
    }

    return findings;
  },
};
