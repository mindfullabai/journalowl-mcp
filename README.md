# @mindfulabai/journalowl-mcp

MCP (Model Context Protocol) server for [JournalOwl](https://journalowl.com) - AI-powered journaling integration for Claude Code, Cursor, and ChatGPT Agents.

## Features

- **Create journal entries** directly from your AI assistant
- **Search and browse** your journal entries
- **Access weekly reviews** with emotional trends and insights
- **Get personalized suggestions** based on your writing style
- **Secure API key authentication** with scoped permissions

## Installation

```bash
npx @mindfulabai/journalowl-mcp
```

Or install globally:

```bash
npm install -g @mindfulabai/journalowl-mcp
```

## Configuration

### 1. Get your API Key

1. Log in to [JournalOwl](https://journalowl.com)
2. Go to **Settings > API Keys**
3. Create a new API key with the scopes you need:
   - `journal:read` - Read your journal entries
   - `journal:write` - Create new entries
   - `review:read` - Access weekly reviews
   - `profile:read` - Access your profile and writing style

### 2. Configure Claude Code

Add to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "journalowl": {
      "command": "npx",
      "args": ["@mindfulabai/journalowl-mcp"],
      "env": {
        "JOURNALOWL_API_KEY": "jowl_sk_your_api_key_here"
      }
    }
  }
}
```

### 3. Configure Cursor

Add to your Cursor MCP settings:

```json
{
  "journalowl": {
    "command": "npx",
    "args": ["@mindfulabai/journalowl-mcp"],
    "env": {
      "JOURNALOWL_API_KEY": "jowl_sk_your_api_key_here"
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `journal_create_entry` | Create a new journal entry |
| `journal_list_entries` | List entries with filters |
| `journal_get_entry` | Get entry details and analysis |
| `journal_search` | Search entries by text |
| `journal_get_weekly_review` | Get weekly review and insights |
| `journal_get_writing_style` | Get writing style preferences |

## Available Resources

| URI | Description |
|-----|-------------|
| `journalowl://user/profile` | User profile and journaling stats |
| `journalowl://user/recent-entries` | Recent entries metadata |

## Example Usage

Once configured, you can use JournalOwl directly in your AI conversations:

```
"Create a journal entry about my productive day at work"

"Show me my journal entries from last week"

"What insights does my weekly review show?"

"Search my journal for entries about anxiety"
```

## Development

```bash
# Clone the repository
git clone https://github.com/mindfulabai/journalowl-mcp.git
cd journalowl-mcp

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Test with MCP Inspector
npm run inspector
```

## Security

- API keys are transmitted securely via HTTPS
- Keys are hashed in our database (we never store the plain key)
- You can revoke keys at any time from JournalOwl settings
- Scopes limit what each key can access

## Support

- [Documentation](https://docs.journalowl.com/mcp)
- [GitHub Issues](https://github.com/mindfulabai/journalowl-mcp/issues)
- [JournalOwl Support](https://journalowl.com/support)

## License

MIT
