// src/resources/index.ts
/**
 * MCP Resource definitions for JournalOwl
 */

import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { JournalOwlClient } from '../client/journalOwlClient.js';

/**
 * Resource: journalowl://user/profile
 * User context for AI personalization
 */
export const profileResource: Resource = {
  uri: 'journalowl://user/profile',
  name: 'User Profile',
  description: 'User journaling profile with stats, preferences, and context for AI personalization',
  mimeType: 'text/plain'
};

export async function handleProfileResource(client: JournalOwlClient) {
  const profile = await client.getUserProfile();

  const text = `JournalOwl User Profile
=======================

Username: ${profile.username}
Email: ${profile.email}
Timezone: ${profile.timezone}

Journaling Stats:
- Journaling since: ${new Date(profile.journalingSince).toLocaleDateString()}
- Total entries: ${profile.totalEntries}
- Current streak: ${profile.currentStreak} days

Preferences:
- Writing style: ${profile.preferredWritingStyle || 'Default'}

Use this context to personalize your responses when helping with journaling.`;

  return {
    contents: [{
      uri: 'journalowl://user/profile',
      mimeType: 'text/plain',
      text
    }]
  };
}

/**
 * Resource: journalowl://user/recent-entries
 * Recent entries metadata for context
 */
export const recentEntriesResource: Resource = {
  uri: 'journalowl://user/recent-entries',
  name: 'Recent Journal Entries',
  description: 'Metadata about the 5 most recent journal entries for conversation context',
  mimeType: 'text/plain'
};

export async function handleRecentEntriesResource(client: JournalOwlClient) {
  const result = await client.listEntries({ limit: 5 });

  if (result.entries.length === 0) {
    return {
      contents: [{
        uri: 'journalowl://user/recent-entries',
        mimeType: 'text/plain',
        text: 'No recent journal entries found. The user may be new to journaling.'
      }]
    };
  }

  const entriesList = result.entries.map(entry =>
    `- ${entry.title} (${new Date(entry.date).toLocaleDateString()})
  Mood: ${entry.mood || 'Not specified'}
  Tags: ${entry.tags.join(', ') || 'None'}
  ID: ${entry.id}`
  ).join('\n\n');

  const text = `Recent Journal Entries (Last ${result.entries.length})
========================================

${entriesList}

Use these entries as context when helping the user with their journaling.
You can use journal_get_entry with an ID to read the full content.`;

  return {
    contents: [{
      uri: 'journalowl://user/recent-entries',
      mimeType: 'text/plain',
      text
    }]
  };
}

/**
 * Get all resource definitions
 */
export function getAllResources(): Resource[] {
  return [
    profileResource,
    recentEntriesResource
  ];
}

/**
 * Handle resource read by URI
 */
export async function handleResourceRead(
  client: JournalOwlClient,
  uri: string
) {
  switch (uri) {
    case 'journalowl://user/profile':
      return handleProfileResource(client);
    case 'journalowl://user/recent-entries':
      return handleRecentEntriesResource(client);
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
