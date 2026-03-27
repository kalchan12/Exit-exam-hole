import { supabase } from './supabaseClient';
import { Question } from './dataLoader';

/**
 * Saves a question to Supabase (insert or update).
 */
export async function saveQuestionToSupabase(question: Partial<Question> & { id: string }): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .upsert({
      id: question.id,
      question: question.question,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation || '',
      topic: question.topic,
      difficulty: question.difficulty || 'medium',
      source: question.source || 'Manual',
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error saving question to Supabase:', error);
    return false;
  }
  return true;
}

/**
 * Updates a question in Supabase.
 */
export async function updateQuestionInSupabase(id: string, data: Partial<Question>): Promise<boolean> {
  const updateData: Record<string, unknown> = {};
  if (data.question !== undefined) updateData.question = data.question;
  if (data.options !== undefined) updateData.options = data.options;
  if (data.answer !== undefined) updateData.answer = data.answer;
  if (data.explanation !== undefined) updateData.explanation = data.explanation;
  if (data.topic !== undefined) updateData.topic = data.topic;
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
  if (data.source !== undefined) updateData.source = data.source;

  const { error } = await supabase
    .from('questions')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating question:', error);
    return false;
  }
  return true;
}

/**
 * Deletes a single question from Supabase.
 */
export async function deleteQuestionFromSupabase(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting question:', error);
    return false;
  }
  return true;
}

/**
 * Deletes all questions for a specific source from Supabase.
 */
export async function deleteTopicQuestions(source: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('source', source);

  if (error) {
    console.error('Error deleting topic questions:', error);
    return false;
  }
  return true;
}

// ─── Notes & Bytes (unchanged) ───

import { Note, Byte } from './dataLoader';

export async function saveNoteToSupabase(note: Note, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .upsert({
      id: note.id,
      user_id: userId,
      topic: note.topic,
      course: note.course,
      title: note.title,
      body: note.body,
      images: note.images,
      links: note.links,
      source: note.source,
      label: note.label,
      major: note.major || 'Both',
      date: note.date,
      github_url: note.githubUrl,
    });

  if (error) {
    console.error('Error saving note to Supabase:', error);
    return false;
  }
  return true;
}

export async function saveByteToSupabase(byte: Byte, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('bytes')
    .upsert({
      id: byte.id,
      user_id: userId,
      topic: byte.topic,
      title: byte.title,
      content: byte.content,
      images: byte.images,
      video_url: byte.videoUrl,
      related_question_ids: byte.relatedQuestionIds,
      source: byte.source,
      major: (byte as any).major || 'Both',
      date: byte.date,
      github_url: byte.githubUrl,
    });

  if (error) {
    console.error('Error saving byte to Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user profile:', error);
    return false;
  }
  return true;
}
