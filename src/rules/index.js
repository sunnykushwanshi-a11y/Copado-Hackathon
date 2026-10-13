/**
 * Governance Rules Registry
 * Each rule: { id, description, severity, category, check(fileContent, filePath) → finding[] }
 */

import { credentialLeakRule } from './credential-leak.js';
import { profilePermissionsRule } from './profile-permissions.js';
import { apiVersionRule } from './api-version.js';
import { apexWithoutTestRule } from './apex-without-test.js';
import { hardcodedUrlRule } from './hardcoded-url.js';
import { adminProfileModRule } from './admin-profile-mod.js';
import { guestUserAccessRule } from './guest-user-access.js';

export const RULES = [
  credentialLeakRule,
  profilePermissionsRule,
  apiVersionRule,
  apexWithoutTestRule,
  hardcodedUrlRule,
  adminProfileModRule,
  guestUserAccessRule,
];
