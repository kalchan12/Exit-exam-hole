'use server';

import fs from 'fs';
import path from 'path';
import { Byte, Note } from '@/lib/dataLoader';

/**
 * Helper to get absolute path to a public/data file.
 */
function getFilePath(filename: string): string {
  return path.join(process.cwd(), 'public', 'data', filename);
}

/**
 * Saves a byte to the local public/data/bytes.json file.
 */
export async function saveByteToLocalFile(byte: Byte): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getFilePath('bytes.json');
    let bytes: Byte[] = [];
    
    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      try {
        bytes = JSON.parse(fileContent);
      } catch {
        bytes = [];
      }
    }
    
    const index = bytes.findIndex((b) => b.id === byte.id);
    if (index !== -1) {
      bytes[index] = byte;
    } else {
      bytes.push(byte);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(bytes, null, 2), 'utf8');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error saving byte locally:', err);
    const message = err instanceof Error ? err.message : 'Failed to save byte';
    return { success: false, error: message };
  }
}

/**
 * Deletes a byte from the local public/data/bytes.json file.
 */
export async function deleteByteFromLocalFile(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getFilePath('bytes.json');
    if (!fs.existsSync(filePath)) return { success: true };
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let bytes: Byte[] = [];
    try {
      bytes = JSON.parse(fileContent);
    } catch {
      bytes = [];
    }
    
    bytes = bytes.filter((b) => b.id !== id);
    fs.writeFileSync(filePath, JSON.stringify(bytes, null, 2), 'utf8');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error deleting byte locally:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete byte';
    return { success: false, error: message };
  }
}

/**
 * Saves a note to the local public/data/notes.json file.
 */
export async function saveNoteToLocalFile(note: Note): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getFilePath('notes.json');
    let notes: Note[] = [];
    
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      try {
        notes = JSON.parse(fileContent);
      } catch {
        notes = [];
      }
    }
    
    const index = notes.findIndex((n) => n.id === note.id);
    if (index !== -1) {
      notes[index] = note;
    } else {
      notes.push(note);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf8');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error saving note locally:', err);
    const message = err instanceof Error ? err.message : 'Failed to save note';
    return { success: false, error: message };
  }
}

/**
 * Deletes a note from the local public/data/notes.json file.
 */
export async function deleteNoteFromLocalFile(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getFilePath('notes.json');
    if (!fs.existsSync(filePath)) return { success: true };
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let notes: Note[] = [];
    try {
      notes = JSON.parse(fileContent);
    } catch {
      notes = [];
    }
    
    notes = notes.filter((n) => n.id !== id);
    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf8');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error deleting note locally:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    return { success: false, error: message };
  }
}

/**
 * Saves a custom course to the local public/data/courses.json file.
 */
export async function saveCourseToLocalFile(courseName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getFilePath('courses.json');
    let courses: string[] = [];
    
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      try {
        courses = JSON.parse(fileContent);
      } catch {
        courses = [];
      }
    }
    
    if (!courses.includes(courseName)) {
      courses.push(courseName);
      fs.writeFileSync(filePath, JSON.stringify(courses, null, 2), 'utf8');
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Error saving course locally:', err);
    const message = err instanceof Error ? err.message : 'Failed to save course';
    return { success: false, error: message };
  }
}
