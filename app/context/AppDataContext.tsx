"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FileMetadata = {
  name: string;
  size: number;
  type: string;
};

export type ResumeAnalysisResult = {
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  suggestions: string[];
};

export type JobMatchResult = {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
};

type AppData = {
  fileMetadata: FileMetadata | null;
  extractedResumeText: string;
  resumeAnalysisResult: ResumeAnalysisResult | null;
  jobDescription: string;
  jobMatchResult: JobMatchResult | null;
};

type AppDataActions = {
  setFileMetadata: (value: FileMetadata | null) => void;
  setExtractedResumeText: (value: string) => void;
  setResumeAnalysisResult: (value: ResumeAnalysisResult | null) => void;
  setJobDescription: (value: string) => void;
  setJobMatchResult: (value: JobMatchResult | null) => void;
};

type AppDataContextValue = AppData & AppDataActions;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AppDataContext = createContext<AppDataContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [extractedResumeText, setExtractedResumeText] = useState("");
  const [resumeAnalysisResult, setResumeAnalysisResult] =
    useState<ResumeAnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobMatchResult, setJobMatchResult] = useState<JobMatchResult | null>(
    null,
  );

  const value: AppDataContextValue = {
    fileMetadata,
    setFileMetadata,
    extractedResumeText,
    setExtractedResumeText,
    resumeAnalysisResult,
    setResumeAnalysisResult,
    jobDescription,
    setJobDescription,
    jobMatchResult,
    setJobMatchResult,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
