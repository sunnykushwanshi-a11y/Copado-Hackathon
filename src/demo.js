/**
 * Demo script — creates mock Salesforce metadata with intentional issues,
 * then runs DeployGuard scan to show findings in action.
 * 
 * Run: node src/demo.js
 */

import { writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';

import { runScan } from './scanner.js';
import { printTable } from './reporter.js';
import chalk from 'chalk';

const DEMO_DIR = './demo-metadata';

const MOCK_FILES = {
  // Bad Apex class — hardcoded password
  'force-app/main/default/classes/PaymentService.cls': `
public class PaymentService {
    private static final String API_KEY = 'sk-prod-abc123secret456xyz';
    private static final String password = 'MyProdP@ssword123';
    private static final String endpoint = 'https://mycompany.salesforce.com/services/data/v45.0';
    
    public static void processPayment(String amount) {
        // Call external payment processor
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint + '/payment');
        req.setHeader('Authorization', 'Bearer ' + API_KEY);
    }
}
`,

  // Old API version metadata
  'force-app/main/default/classes/PaymentService.cls-meta.xml': `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>45.0</apiVersion>
    <status>Active</status>
</ApexClass>`,

  // Dangerous profile
  'force-app/main/default/profiles/CustomAdmin.profile-meta.xml': `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <userPermissions>
        <enabled>true</enabled>
        <name>ModifyAllData</name>
    </userPermissions>
    <userPermissions>
        <enabled>true</enabled>
        <name>ViewAllData</name>
    </userPermissions>
    <userPermissions>
        <enabled>true</enabled>
        <name>ManageUsers</name>
    </userPermissions>
</Profile>`,

  // System admin profile modified
  'force-app/main/default/profiles/Admin.profile-meta.xml': `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <custom>false</custom>
    <userPermissions>
        <enabled>true</enabled>
        <name>ModifyAllData</name>
    </userPermissions>
</Profile>`,

  // Apex class without test
  'force-app/main/default/classes/InvoiceGenerator.cls': `
public class InvoiceGenerator {
    public static String generateInvoice(Id orderId) {
        // Complex invoice generation logic
        return 'INV-' + orderId;
    }
}
`,
  'force-app/main/default/classes/InvoiceGenerator.cls-meta.xml': `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <status>Active</status>
</ApexClass>`,

  // Good class with test — should pass
  'force-app/main/default/classes/AccountHelper.cls': `
public class AccountHelper {
    public static List<Account> getTopAccounts() {
        return [SELECT Id, Name FROM Account LIMIT 10];
    }
}
`,
  'force-app/main/default/classes/AccountHelperTest.cls': `
@isTest
public class AccountHelperTest {
    @isTest
    static void testGetTopAccounts() {
        List<Account> result = AccountHelper.getTopAccounts();
        System.assertNotEquals(null, result);
    }
}
`,
};

async function main() {
  console.log(chalk.bold.cyan('\n🎬 Agentia DeployGuard — Demo Mode\n'));
  console.log(chalk.gray('Creating mock Salesforce metadata with intentional issues...\n'));

  // Create mock files
  for (const [relPath, content] of Object.entries(MOCK_FILES)) {
    const fullPath = join(DEMO_DIR, relPath);
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content.trim(), 'utf8');
  }

  console.log(chalk.green(`  ✓ Created ${Object.keys(MOCK_FILES).length} mock metadata files\n`));
  console.log(chalk.bold.cyan('🔍 Running DeployGuard scan on mock metadata...\n'));

  const results = await runScan(DEMO_DIR);
  printTable(results);

  const blocked = results.summary.critical > 0 || results.summary.high > 0;
  if (blocked) {
    console.log(chalk.red.bold('❌ DEMO: This deployment would be BLOCKED by DeployGuard'));
    console.log(chalk.yellow('   Fix the critical/high issues above before running: agentia cicd work push\n'));
  }

  // Cleanup
  await rm(DEMO_DIR, { recursive: true, force: true });
  console.log(chalk.gray('  (Demo metadata cleaned up)\n'));
}

main().catch((err) => {
  console.error(chalk.red('Demo error:', err.message));
  process.exit(1);
});
