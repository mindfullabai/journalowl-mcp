// src/types/index.ts
/**
 * Type definitions for JournalOwl MCP Server
 */

// Journal Entry types
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  tags: string[];
  status: 'draft' | 'in_progress' | 'completed';
  date: string;
  createdAt: string;
  updatedAt: string;
  analysis?: EntryAnalysis;
}

export interface EntryAnalysis {
  sentiment?: number;
  themes?: string[];
  insights?: string[];
}

export interface CreateEntryInput {
  content: string;
  mood?: string;
  tags?: string[];
}

export interface ListEntriesParams {
  limit?: number;
  offset?: number;
  from_date?: string;
  to_date?: string;
  status?: 'draft' | 'in_progress' | 'completed';
  tags?: string;
}

export interface SearchEntriesInput {
  query: string;
  limit?: number;
}

// Weekly Review types
export interface WeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  themes: string[];
  emotionalTrend: string;
  insights: string[];
  entriesCount: number;
  createdAt: string;
}

export interface ListReviewsParams {
  limit?: number;
  offset?: number;
}

// User Profile types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  timezone: string;
  journalingSince: string;
  totalEntries: number;
  currentStreak: number;
  preferredWritingStyle?: string;
}

// Writing Style types
export interface WritingStyle {
  currentStyle: string;
  styleDescription: string;
  voiceTone: string;
  suggestions: string[];
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Client configuration
export interface JournalOwlConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

// Error types
export interface ApiError {
  status: 'error';
  message: string;
  code?: string;
}
