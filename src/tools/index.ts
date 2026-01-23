// src/tools/index.ts
/**
 * MCP Tool definitions for JournalOwl
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { JournalOwlClient } from '../client/journalOwlClient.js';

/**
 * Tool: journal_create_entry
 * Create a new journal entry
 */
export const createEntryTool: Tool = {
  name: 'journal_create_entry',
  description: 'Create a new journal entry in JournalOwl. Entry is created with status "in_progress". Use journal_finalize_entry to generate AI analysis and complete the entry.',
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The content of the journal entry. Write freely about your thoughts, feelings, or experiences.'
      },
      mood: {
        type: 'string',
        description: 'Optional current mood (e.g., "happy", "anxious", "peaceful", "motivated")'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional tags to categorize the entry (e.g., ["work", "gratitude", "goals"])'
      },
      date: {
        type: 'string',
        description: 'Optional date for the entry in ISO 8601 format (e.g., "2024-01-15"). Defaults to today in your timezone.'
      }
    },
    required: ['content']
  }
};

export async function handleCreateEntry(
  client: JournalOwlClient,
  args: { content: string; mood?: string; tags?: string[]; date?: string }
) {
  const result = await client.createEntry({
    content: args.content,
    mood: args.mood,
    tags: args.tags,
    date: args.date
  });

  const entry = result.entry;
  const metadata = result.metadata;

  let text = `Journal entry created!\n\n` +
    `**ID:** ${entry.id}\n` +
    `**Title:** ${entry.title}\n` +
    `**Status:** ${entry.status} (use journal_finalize_entry to generate AI analysis)\n` +
    `**Date:** ${new Date(entry.date).toLocaleDateString()}\n` +
    `**Mood:** ${entry.mood || 'Not specified'}\n` +
    `**Tags:** ${entry.tags.length > 0 ? entry.tags.join(', ') : 'None'}`;

  if (metadata) {
    text += `\n\n**Settings used:**\n` +
      `- Timezone: ${metadata.timezone}\n` +
      `- Language: ${metadata.language}\n` +
      `- Writing Style: ${metadata.writingStyle}`;
  }

  return {
    content: [{
      type: 'text' as const,
      text
    }]
  };
}

/**
 * Tool: journal_finalize_entry
 * Finalize an entry and generate AI analysis
 */
export const finalizeEntryTool: Tool = {
  name: 'journal_finalize_entry',
  description: 'Finalize a journal entry and generate AI analysis. This generates sentiment analysis, themes, and insights. Entry must have at least 100 characters.',
  inputSchema: {
    type: 'object',
    properties: {
      entry_id: {
        type: 'string',
        description: 'The ID of the journal entry to finalize'
      }
    },
    required: ['entry_id']
  }
};

export async function handleFinalizeEntry(
  client: JournalOwlClient,
  args: { entry_id: string }
) {
  const result = await client.finalizeEntry(args.entry_id);

  const entry = result.entry;
  const miniReview = result.miniReview;

  let text = `Entry finalized with AI analysis!\n\n` +
    `**ID:** ${entry.id}\n` +
    `**Title:** ${entry.title}\n` +
    `**Status:** ${entry.status}`;

  if (miniReview) {
    text += `\n\n**AI Analysis:**\n` +
      `- **Main Topic:** ${miniReview.mainTopic}\n` +
      `- **Sentiment:** ${miniReview.sentiment.label} (${miniReview.sentiment.score.toFixed(2)})\n` +
      `- **Themes:** ${miniReview.themes.join(', ')}`;

    if (miniReview.keyInsight) {
      text += `\n\n**Key Insight:**\n${miniReview.keyInsight}`;
    }
  }

  if (entry.analysis) {
    if (entry.analysis.insights && entry.analysis.insights.length > 0) {
      text += `\n\n**Insights:**\n${entry.analysis.insights.map(i => `- ${i}`).join('\n')}`;
    }
  }

  return {
    content: [{
      type: 'text' as const,
      text
    }]
  };
}

/**
 * Tool: journal_list_entries
 * List journal entries with filters
 */
export const listEntriesTool: Tool = {
  name: 'journal_list_entries',
  description: 'List journal entries from JournalOwl. Use filters to find specific entries by date, status, or tags.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of entries to return (default: 20, max: 50)'
      },
      offset: {
        type: 'number',
        description: 'Number of entries to skip for pagination'
      },
      from_date: {
        type: 'string',
        description: 'Start date filter (ISO 8601 format, e.g., "2024-01-01")'
      },
      to_date: {
        type: 'string',
        description: 'End date filter (ISO 8601 format)'
      },
      status: {
        type: 'string',
        enum: ['draft', 'in_progress', 'completed'],
        description: 'Filter by entry status'
      },
      tags: {
        type: 'string',
        description: 'Comma-separated list of tags to filter by'
      }
    }
  }
};

export async function handleListEntries(
  client: JournalOwlClient,
  args: {
    limit?: number;
    offset?: number;
    from_date?: string;
    to_date?: string;
    status?: string;
    tags?: string;
  }
) {
  const result = await client.listEntries({
    limit: args.limit,
    offset: args.offset,
    from_date: args.from_date,
    to_date: args.to_date,
    status: args.status as any,
    tags: args.tags
  });

  if (result.entries.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'No journal entries found matching your criteria.'
      }]
    };
  }

  const entriesList = result.entries.map(entry =>
    `- **${entry.title}** (${new Date(entry.date).toLocaleDateString()})\n` +
    `  ID: ${entry.id} | Status: ${entry.status} | Tags: ${entry.tags.join(', ') || 'none'}`
  ).join('\n\n');

  return {
    content: [{
      type: 'text' as const,
      text: `Found ${result.pagination.total} entries (showing ${result.entries.length}):\n\n${entriesList}` +
        (result.pagination.hasMore ? `\n\nMore entries available. Use offset=${(args.offset || 0) + result.entries.length} to see more.` : '')
    }]
  };
}

/**
 * Tool: journal_get_entry
 * Get a specific entry with details and analysis
 */
export const getEntryTool: Tool = {
  name: 'journal_get_entry',
  description: 'Get a specific journal entry by ID, including its AI analysis and insights.',
  inputSchema: {
    type: 'object',
    properties: {
      entry_id: {
        type: 'string',
        description: 'The ID of the journal entry to retrieve'
      },
      include_analysis: {
        type: 'boolean',
        description: 'Whether to include AI analysis (default: true)'
      }
    },
    required: ['entry_id']
  }
};

export async function handleGetEntry(
  client: JournalOwlClient,
  args: { entry_id: string; include_analysis?: boolean }
) {
  const entry = await client.getEntry(args.entry_id, args.include_analysis !== false);

  let text = `# ${entry.title}\n\n` +
    `**Date:** ${new Date(entry.date).toLocaleDateString()}\n` +
    `**Mood:** ${entry.mood || 'Not specified'}\n` +
    `**Tags:** ${entry.tags.join(', ') || 'None'}\n` +
    `**Status:** ${entry.status}\n\n` +
    `---\n\n${entry.content}`;

  if (entry.analysis) {
    text += `\n\n---\n\n## AI Analysis\n\n`;
    if (entry.analysis.sentiment !== undefined) {
      const sentimentLabel = entry.analysis.sentiment > 0.3 ? 'Positive' :
        entry.analysis.sentiment < -0.3 ? 'Negative' : 'Neutral';
      text += `**Sentiment:** ${sentimentLabel} (${entry.analysis.sentiment.toFixed(2)})\n\n`;
    }
    if (entry.analysis.themes && entry.analysis.themes.length > 0) {
      text += `**Themes:** ${entry.analysis.themes.join(', ')}\n\n`;
    }
    if (entry.analysis.insights && entry.analysis.insights.length > 0) {
      text += `**Insights:**\n${entry.analysis.insights.map(i => `- ${i}`).join('\n')}`;
    }
  }

  return {
    content: [{
      type: 'text' as const,
      text
    }]
  };
}

/**
 * Tool: journal_search
 * Search entries by text
 */
export const searchEntriesTool: Tool = {
  name: 'journal_search',
  description: 'Search journal entries by text. Find entries related to specific topics, emotions, or events.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find relevant entries'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10, max: 20)'
      }
    },
    required: ['query']
  }
};

export async function handleSearchEntries(
  client: JournalOwlClient,
  args: { query: string; limit?: number }
) {
  const result = await client.searchEntries({
    query: args.query,
    limit: args.limit
  });

  if (result.count === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: `No entries found matching "${args.query}".`
      }]
    };
  }

  const resultsList = result.results.map(entry =>
    `- **${entry.title}** (${new Date(entry.date).toLocaleDateString()})\n` +
    `  ID: ${entry.id}\n` +
    `  Preview: ${entry.content.substring(0, 150)}...`
  ).join('\n\n');

  return {
    content: [{
      type: 'text' as const,
      text: `Found ${result.count} entries for "${args.query}":\n\n${resultsList}`
    }]
  };
}

/**
 * Tool: journal_get_weekly_review
 * Get weekly review with insights
 */
export const getWeeklyReviewTool: Tool = {
  name: 'journal_get_weekly_review',
  description: 'Get a weekly review summarizing journaling activity, emotional trends, and insights. Use "latest" to get the most recent review.',
  inputSchema: {
    type: 'object',
    properties: {
      week: {
        type: 'string',
        description: 'Week identifier: "latest" for most recent, or a specific review ID'
      }
    }
  }
};

export async function handleGetWeeklyReview(
  client: JournalOwlClient,
  args: { week?: string }
) {
  const review = await client.getWeeklyReview(args.week || 'latest');

  const text = `# Weekly Review\n\n` +
    `**Period:** ${new Date(review.weekStart).toLocaleDateString()} - ${new Date(review.weekEnd).toLocaleDateString()}\n` +
    `**Entries:** ${review.entriesCount}\n\n` +
    `## Summary\n\n${review.summary}\n\n` +
    `## Emotional Trend\n\n${review.emotionalTrend}\n\n` +
    `## Key Themes\n\n${review.themes.map(t => `- ${t}`).join('\n')}\n\n` +
    `## Insights\n\n${review.insights.map(i => `- ${i}`).join('\n')}`;

  return {
    content: [{
      type: 'text' as const,
      text
    }]
  };
}

/**
 * Tool: journal_get_writing_style
 * Get user's writing style and suggestions
 */
export const getWritingStyleTool: Tool = {
  name: 'journal_get_writing_style',
  description: 'Get the user\'s preferred writing style, tone, and personalized journaling suggestions.',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

export async function handleGetWritingStyle(client: JournalOwlClient) {
  const style = await client.getWritingStyle();

  const text = `# Your Writing Style\n\n` +
    `**Current Style:** ${style.currentStyle}\n\n` +
    `**Description:** ${style.styleDescription}\n\n` +
    `**Voice Tone:** ${style.voiceTone}\n\n` +
    `## Suggestions for Your Journaling\n\n` +
    style.suggestions.map(s => `- ${s}`).join('\n');

  return {
    content: [{
      type: 'text' as const,
      text
    }]
  };
}

/**
 * Get all tool definitions
 */
export function getAllTools(): Tool[] {
  return [
    createEntryTool,
    finalizeEntryTool,
    listEntriesTool,
    getEntryTool,
    searchEntriesTool,
    getWeeklyReviewTool,
    getWritingStyleTool
  ];
}

/**
 * Handle tool call by name
 */
export async function handleToolCall(
  client: JournalOwlClient,
  toolName: string,
  args: Record<string, unknown>
) {
  switch (toolName) {
    case 'journal_create_entry':
      return handleCreateEntry(client, args as any);
    case 'journal_finalize_entry':
      return handleFinalizeEntry(client, args as any);
    case 'journal_list_entries':
      return handleListEntries(client, args as any);
    case 'journal_get_entry':
      return handleGetEntry(client, args as any);
    case 'journal_search':
      return handleSearchEntries(client, args as any);
    case 'journal_get_weekly_review':
      return handleGetWeeklyReview(client, args as any);
    case 'journal_get_writing_style':
      return handleGetWritingStyle(client);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
