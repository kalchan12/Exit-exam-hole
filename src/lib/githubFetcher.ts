import { Note, Question } from './dataLoader';
import { parseQuestionsFromMarkdown, parseQuestionsFromJson } from './parsers';

/**
 * Extracts the first Markdown heading as the title, or falls back to 'Untitled Note'.
 */
function extractTitleFromMarkdown(md: string): string {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled Note';
}

/**
 * Extracts image URLs from Markdown content.
 */
function extractImagesFromMarkdown(md: string): string[] {
  const images: string[] = [];
  const regex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = regex.exec(md)) !== null) {
    images.push(match[1]);
  }
  return images;
}

/**
 * Normalizes a GitHub URL to its raw content version.
 */
function normalizeGitHubUrl(url: string): string {
    let fetchUrl = url;
    if (fetchUrl.includes('github.com') && !fetchUrl.includes('raw.githubusercontent.com')) {
      fetchUrl = fetchUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return fetchUrl;
}

const CACHE_PREFIX = 'gh_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
    content: string;
    timestamp: number;
}

async function fetchWithCache(url: string, forceRefresh = false): Promise<string> {
    const fetchUrl = normalizeGitHubUrl(url);
    const cacheKey = `${CACHE_PREFIX}${fetchUrl}`;
    
    if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            if (Date.now() - entry.timestamp < CACHE_TTL) {
                return entry.content;
            }
        }
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
        throw new Error(`Failed to fetch from ${fetchUrl}: ${res.statusText}`);
    }
    
    const content = await res.text();
    const newEntry: CacheEntry = {
        content,
        timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(newEntry));
    return content;
}

/**
 * Fetches a raw Markdown file from a URL and normalizes it into a Note object.
 */
export async function fetchGitHubNote(url: string, course: string = 'General', forceRefresh = false): Promise<Note> {
  try {
    const markdown = await fetchWithCache(url, forceRefresh);
    const title = extractTitleFromMarkdown(markdown);
    const images = extractImagesFromMarkdown(markdown);

    const note: Note = {
      id: `gh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      topic: course,
      course: course,
      title,
      body: markdown,
      images,
      source: 'GitHub',
      links: [url]
    };

    return note;
  } catch (error) {
    console.error('Error in fetchGitHubNote:', error);
    throw error;
  }
}

/**
 * Fetches a raw Markdown file from a URL and parses it into an array of Question objects.
 */
export async function fetchGitHubQuestions(url: string, course: string = 'General', forceRefresh = false): Promise<Question[]> {
    try {
      const content = await fetchWithCache(url, forceRefresh);
      if (url.toLowerCase().split('?')[0].endsWith('.json')) {
        return parseQuestionsFromJson(content, course);
      }
      return parseQuestionsFromMarkdown(content, course);
    } catch (error) {
      console.error('Error in fetchGitHubQuestions:', error);
        throw error;
    }
}

/**
 * Clears all GitHub-related cache entries.
 */
export function clearGitHubCache() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            keys.push(key);
        }
    }
    keys.forEach(k => localStorage.removeItem(k));
}
