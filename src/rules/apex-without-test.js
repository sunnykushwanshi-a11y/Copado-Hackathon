/**
 * Rule: Apex Classes Without @isTest Coverage Signal
 * Warns when Apex classes lack an accompanying test class reference
 */

export const apexWithoutTestRule = {
  id: 'DG-004-APEX-NO-TEST',
  description: 'Flags Apex classes that appear to have no paired test class in the deployment set',
  severity: 'medium',
  category: 'quality',

  // State shared across files — populated during scan
  _apexClasses: new Set(),
  _testClasses: new Set(),

  check(content, filePath) {
    const findings = [];

    if (!filePath.endsWith('.cls')) return findings;

    const className = filePath.split(/[\\/]/).pop().replace('.cls', '');

    // Identify test classes by @isTest annotation
    const isTestClass = /@isTest/i.test(content);

    if (isTestClass) {
      this._testClasses.add(className.toLowerCase());
    } else {
      this._apexClasses.add(className.toLowerCase());
    }

    return findings; // Findings emitted in postCheck
  },

  postCheck() {
    const findings = [];

    for (const cls of this._apexClasses) {
      // Heuristic: test class should be named <ClassName>Test or Test<ClassName>
      const hasTest =
        this._testClasses.has(`${cls}test`) ||
        this._testClasses.has(`test${cls}`) ||
        this._testClasses.has(`${cls}_test`) ||
        [...this._testClasses].some((t) => t.includes(cls));

      if (!hasTest) {
        findings.push({
          rule: apexWithoutTestRule.id,
          severity: 'medium',
          category: 'quality',
          file: `force-app/**/${cls}.cls`,
          line: null,
          message: `No test class found for "${cls}" in this deployment set`,
          remediation: `Ensure a test class (e.g. "${cls}Test") is included in the deployment. Salesforce requires ≥75% coverage to deploy to production.`,
        });
      }
    }

    // Reset state for re-use
    this._apexClasses = new Set();
    this._testClasses = new Set();

    return findings;
  },
};
