import { supabase } from './supabaseClient';
import { Note, Question, Byte } from './dataLoader';

/**
 * Saves a note to Supabase.
 */
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

/**
 * Saves a question to Supabase.
 */
export async function saveQuestionToSupabase(question: Question, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .upsert({
      id: question.id,
      user_id: userId,
      question: question.question,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
      source: question.source,
      year: (question as any).year, // Custom field for exams
      major: (question as any).major || 'Both',
      date: question.date || new Date().toISOString(),
      github_url: question.githubUrl,
    });

  if (error) {
    console.error('Error saving question to Supabase:', error);
    return false;
  }
  return true;
}

/**
 * Saves a byte to Supabase.
 */
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
/**
 * Deletes all questions for a specific topic/source from Supabase.
 */
export async function deleteTopicQuestions(topicName: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('source', topicName);

  if (error) {
    console.error('Error deleting topic questions:', error);
    return false;
  }
  return true;
}

/**
 * Deletes a user profile and (optionally) provides instructions for auth cleanup.
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  // First delete profile
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.error('Error deleting user profile:', profileError);
    return false;
  }
  
  // Note: auth.users deletion usually requires service_role or admin API
  // For this client-side app, we'll assume the profile deletion is the primary action
  // or that the admin handles the auth portal manually if needed.
  return true;
}
