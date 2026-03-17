import { Note } from './dataLoader';

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
 * Fetches a raw Markdown file from a URL and normalizes it into a Note object.
 */
export async function fetchGitHubNote(url: string, course: string = 'General'): Promise<Note> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch from ${url}: ${res.statusText}`);
    }
    
    const markdown = await res.text();
    const title = extractTitleFromMarkdown(markdown);
    const images = extractImagesFromMarkdown(markdown);

    const note: Note = {
      id: `gh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      topic: course, // Use the provided course as the topic
      course: course,
      title,
      body: markdown,
      images,
      source: 'GitHub',
      links: [url] // Store the original URL as a link
    };

    return note;
  } catch (error) {
    console.error('Error in fetchGitHubNote:', error);
    throw error;
  }
}
