import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResumeAnalysisRow = {
  id: string;
  user_id: string;
  file_name: string;
  extracted_text: string;
  match_score: number;
  strengths: string[];
  missing_skills: string[];
  suggestions: string[];
  created_at: string;
};

export type JobMatchRow = {
  id: string;
  user_id: string;
  job_description: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
  created_at: string;
};

// ---------------------------------------------------------------------------
// Resume analyses
// ---------------------------------------------------------------------------

export async function saveResumeAnalysis(
  userId: string,
  payload: {
    fileName: string;
    extractedText: string;
    matchScore: number;
    strengths: string[];
    missingSkills: string[];
    suggestions: string[];
  },
): Promise<ResumeAnalysisRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("resume_analyses")
    .insert({
      user_id: userId,
      file_name: payload.fileName,
      extracted_text: payload.extractedText,
      match_score: payload.matchScore,
      strengths: payload.strengths,
      missing_skills: payload.missingSkills,
      suggestions: payload.suggestions,
    })
    .select(
      "id, user_id, file_name, extracted_text, match_score, strengths, missing_skills, suggestions, created_at",
    )
    .single();

  if (error || !data) return null;
  return data as ResumeAnalysisRow;
}

export async function loadResumeAnalyses(
  userId: string,
): Promise<ResumeAnalysisRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("resume_analyses")
    .select(
      "id, user_id, file_name, extracted_text, match_score, strengths, missing_skills, suggestions, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as ResumeAnalysisRow[];
}

// ---------------------------------------------------------------------------
// Job match results
// ---------------------------------------------------------------------------

export async function saveJobMatch(
  userId: string,
  payload: {
    jobDescription: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    suggestions: string[];
  },
): Promise<JobMatchRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("job_match_results")
    .insert({
      user_id: userId,
      job_description: payload.jobDescription,
      match_score: payload.matchScore,
      matched_skills: payload.matchedSkills,
      missing_skills: payload.missingSkills,
      suggestions: payload.suggestions,
    })
    .select(
      "id, user_id, job_description, match_score, matched_skills, missing_skills, suggestions, created_at",
    )
    .single();

  if (error || !data) return null;
  return data as JobMatchRow;
}

export async function loadJobMatches(userId: string): Promise<JobMatchRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("job_match_results")
    .select(
      "id, user_id, job_description, match_score, matched_skills, missing_skills, suggestions, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as JobMatchRow[];
}
