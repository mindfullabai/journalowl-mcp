#!/usr/bin/env node
// src/index.ts
/**
 * JournalOwl MCP Server
 *
 * Model Context Protocol server for integrating JournalOwl with
 * Claude Code, Cursor, ChatGPT Agents, and other MCP-compatible tools.
 *
 * @module @mindfulabai/journalowl-mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { createClient, JournalOwlClient } from './client/journalOwlClient.js';
import { getAllTools, handleToolCall } from './tools/index.js';
import { getAllResources, handleResourceRead } from './resources/index.js';

// Server metadata
const SERVER_NAME = 'journalowl-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * Main MCP Server class
 */
class JournalOwlMcpServer {
  private server: Server;
  private client: JournalOwlClient;

  constructor() {
    // Initialize HTTP client
    try {
      this.client = createClient();
    } catch (error) {
      console.error(`Failed to initialize JournalOwl client: ${error}`);
      process.exit(1);
    }

    // Initialize MCP server
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: getAllTools()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await handleToolCall(this.client, name, args || {});
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(ErrorCode.InternalError, `Tool ${name} failed: ${message}`);
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: getAllResources()
      };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        return await handleResourceRead(this.client, uri);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(ErrorCode.InternalError, `Resource ${uri} failed: ${message}`);
      }
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`JournalOwl MCP Server v${SERVER_VERSION} running on stdio`);
  }
}

// Start server
const server = new JournalOwlMcpServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
