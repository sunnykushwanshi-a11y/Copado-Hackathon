/**
 * Agentia DeployGuard — MCP Server
 * 
 * Exposes DeployGuard as an MCP tool so Cursor/VS Code/Claude can call it natively.
 * 
 * Usage:
 *   node src/mcp-server.js
 *   (or via agentia mcp start when configured in mcp.json)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { runScan } from './scanner.js';

const server = new Server(
  { name: 'agentia-deployguard', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ─── LIST TOOLS ──────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'deployguard_scan',
      description:
        'Scans Salesforce metadata for security vulnerabilities, governance violations, and quality issues before deployment via Agentia CLI. ' +
        'Returns a structured report with findings grouped by severity (critical, high, medium, low).',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or relative path to the Salesforce project root (defaults to current directory)',
          },
          fail_on: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Minimum severity that constitutes a blocking finding (default: high)',
          },
        },
        required: [],
      },
    },
    {
      name: 'deployguard_summary',
      description:
        'Returns a plain-text risk summary suitable for inclusion in an AI agent prompt. ' +
        'Use this before calling agentia cicd work push to get a risk assessment.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the Salesforce project root',
          },
        },
        required: [],
      },
    },
    {
      name: 'deployguard_rules',
      description: 'Lists all active governance rules with their IDs, severity, and descriptions.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

// ─── HANDLE TOOL CALLS ───────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'deployguard_scan') {
    const path = args?.path ?? process.cwd();
    const failOn = args?.fail_on ?? 'high';

    try {
      const results = await runScan(path);
      const severityOrder = ['low', 'medium', 'high', 'critical'];
      const threshold = severityOrder.indexOf(failOn);
      const blocked = results.findings.some(
        (f) => severityOrder.indexOf(f.severity) >= threshold
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: blocked ? 'BLOCKED' : 'PASSED',
                summary: results.summary,
                filesScanned: results.filesScanned,
                elapsed: results.elapsed,
                findings: results.findings,
                recommendation: blocked
                  ? `Do NOT proceed with deployment. Fix ${results.summary.critical} critical and ${results.summary.high} high severity issues first.`
                  : 'Deployment scan passed. You may proceed with: agentia cicd work push',
              },
              null,
              2
            ),
          },
        ],
        isError: blocked,
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `DeployGuard scan error: ${err.message}` }],
        isError: true,
      };
    }
  }

  if (name === 'deployguard_summary') {
    const path = args?.path ?? process.cwd();
    try {
      const results = await runScan(path);
      const critical = results.findings.filter((f) => f.severity === 'critical');
      const high = results.findings.filter((f) => f.severity === 'high');

      const summaryText = [
        `DeployGuard Pre-Deployment Risk Report`,
        `Scanned: ${results.filesScanned} files | Found: ${results.summary.total} issues`,
        `Critical: ${results.summary.critical} | High: ${results.summary.high} | Medium: ${results.summary.medium} | Low: ${results.summary.low}`,
        '',
        'Top findings requiring attention:',
        ...critical
          .concat(high)
          .slice(0, 8)
          .map((f) => `  [${f.severity.toUpperCase()}] ${f.rule}: ${f.message} (${f.file})`),
      ].join('\n');

      return {
        content: [{ type: 'text', text: summaryText }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }

  if (name === 'deployguard_rules') {
    const { RULES } = await import('./rules/index.js');
    const ruleList = RULES.map((r) => ({
      id: r.id,
      severity: r.severity,
      category: r.category,
      description: r.description,
    }));
    return {
      content: [{ type: 'text', text: JSON.stringify(ruleList, null, 2) }],
    };
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// ─── START ───────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Agentia DeployGuard MCP server running on stdio');
