// src/client/journalOwlClient.ts
/**
 * HTTP Client for JournalOwl API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  JournalOwlConfig,
  JournalEntry,
  WeeklyReview,
  UserProfile,
  WritingStyle,
  CreateEntryInput,
  ListEntriesParams,
  SearchEntriesInput,
  ListReviewsParams,
  ApiResponse,
  ApiError
} from '../types/index.js';

const DEFAULT_BASE_URL = 'https://journalai-backend-production.up.railway.app/api/v1';
const DEFAULT_TIMEOUT = 30000;

export class JournalOwlClient {
  private client: AxiosInstance;

  constructor(config: JournalOwlConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required. Set JOURNALOWL_API_KEY environment variable.');
    }

    this.client = axios.create({
      baseURL: config.baseUrl || DEFAULT_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'journalowl-mcp/0.1.0'
      }
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          const message = error.response.data?.message || error.message;
          throw new Error(`JournalOwl API Error (${error.response.status}): ${message}`);
        } else if (error.request) {
          throw new Error('JournalOwl API is unreachable. Please check your network connection.');
        } else {
          throw new Error(`Request failed: ${error.message}`);
        }
      }
    );
  }

  // ========== ENTRIES ==========

  /**
   * List journal entries with optional filters
   */
  async listEntries(params: ListEntriesParams = {}): Promise<{
    entries: JournalEntry[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    const response = await this.client.get<ApiResponse<{
      entries: JournalEntry[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>>('/mcp/entries', { params });

    return response.data.data!;
  }

  /**
   * Get a specific journal entry by ID
   */
  async getEntry(entryId: string, includeAnalysis: boolean = true): Promise<JournalEntry> {
    const response = await this.client.get<ApiResponse<{ entry: JournalEntry }>>(
      `/mcp/entries/${entryId}`,
      { params: { include_analysis: includeAnalysis } }
    );

    return response.data.data!.entry;
  }

  /**
   * Create a new journal entry
   */
  async createEntry(input: CreateEntryInput): Promise<JournalEntry> {
    const response = await this.client.post<ApiResponse<{ entry: JournalEntry }>>(
      '/mcp/entries',
      input
    );

    return response.data.data!.entry;
  }

  /**
   * Search entries by text
   */
  async searchEntries(input: SearchEntriesInput): Promise<{
    query: string;
    results: JournalEntry[];
    count: number;
  }> {
    const response = await this.client.post<ApiResponse<{
      query: string;
      results: JournalEntry[];
      count: number;
    }>>('/mcp/entries/search', input);

    return response.data.data!;
  }

  // ========== REVIEWS ==========

  /**
   * List weekly reviews
   */
  async listWeeklyReviews(params: ListReviewsParams = {}): Promise<{
    reviews: WeeklyReview[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    const response = await this.client.get<ApiResponse<{
      reviews: WeeklyReview[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>>('/mcp/reviews/weekly', { params });

    return response.data.data!;
  }

  /**
   * Get a specific weekly review by ID or 'latest'
   */
  async getWeeklyReview(reviewId: string = 'latest'): Promise<WeeklyReview> {
    const response = await this.client.get<ApiResponse<{ review: WeeklyReview }>>(
      `/mcp/reviews/weekly/${reviewId}`
    );

    return response.data.data!.review;
  }

  // ========== USER ==========

  /**
   * Get user profile with journaling stats
   */
  async getUserProfile(): Promise<UserProfile> {
    const response = await this.client.get<ApiResponse<{ profile: UserProfile }>>(
      '/mcp/user/profile'
    );

    return response.data.data!.profile;
  }

  /**
   * Get user's writing style preferences
   */
  async getWritingStyle(): Promise<WritingStyle> {
    const response = await this.client.get<ApiResponse<{ style: WritingStyle }>>(
      '/mcp/user/style'
    );

    return response.data.data!.style;
  }
}

/**
 * Create a JournalOwl client from environment variables
 */
export function createClient(config?: Partial<JournalOwlConfig>): JournalOwlClient {
  const apiKey = config?.apiKey || process.env.JOURNALOWL_API_KEY;

  if (!apiKey) {
    throw new Error(
      'JOURNALOWL_API_KEY environment variable is required. ' +
      'Get your API key from JournalOwl Settings > API Keys.'
    );
  }

  return new JournalOwlClient({
    apiKey,
    baseUrl: config?.baseUrl || process.env.JOURNALOWL_API_URL,
    timeout: config?.timeout
  });
}
