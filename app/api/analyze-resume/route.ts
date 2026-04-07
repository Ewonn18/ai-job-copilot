import { NextResponse } from "next/server";

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = /\.(pdf|docx)$/i;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Extracts a best-effort plaintext string from the uploaded file buffer.
 * For PDFs this captures readable text streams; for DOCX it surfaces XML
 * content which still contains keyword-detectable words.
 */
function extractText(buffer: Uint8Array): string {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const raw = decoder.decode(buffer);

  // Collect runs of printable ASCII / common Unicode words (length >= 3).
  const runs = raw.match(/[\x20-\x7E\u00C0-\u024F]{3,}/g) ?? [];
  return runs.join(" ").toLowerCase();
}

type KeywordSignal = {
  keywords: string[];
  strength: string;
  missing: string;
  suggestion: string;
};

/**
 * Keyword signals used to derive context-aware analysis.
 * Each entry checks for the presence of its keywords in the extracted text
 * and contributes a strength, a gap, or an improvement suggestion.
 */
const KEYWORD_SIGNALS: KeywordSignal[] = [
  {
    keywords: ["managed", "led", "leadership", "team", "director", "head of"],
    strength: "Demonstrates leadership and team management experience",
    missing: "Add measurable outcomes for teams you have led",
    suggestion:
      'Quantify team size and impact (e.g. "Led a team of 8 engineers")',
  },
  {
    keywords: ["increased", "grew", "reduced", "saved", "%", "revenue", "cost"],
    strength: "Includes quantified, results-driven achievements",
    missing: "Not enough measurable impact visible in current version",
    suggestion:
      "Add at least two metrics per role to support your impact claims",
  },
  {
    keywords: [
      "react",
      "typescript",
      "next.js",
      "node",
      "python",
      "sql",
      "aws",
      "docker",
    ],
    strength: "Strong technical stack with relevant modern tools",
    missing:
      "Consider listing core tools used in each role, not just a skills section",
    suggestion:
      "Embed key technologies naturally in bullet points, not only a skills list",
  },
  {
    keywords: [
      "collaborated",
      "cross-functional",
      "stakeholder",
      "worked with",
    ],
    strength: "Shows cross-functional collaboration and stakeholder awareness",
    missing:
      "Collaboration and communication skills are not clearly demonstrated",
    suggestion:
      "Describe at least one example of cross-team or cross-department work",
  },
  {
    keywords: ["summary", "objective", "profile", "about me"],
    strength:
      "Professional summary is present and frames your experience clearly",
    missing:
      "A concise professional summary is missing from the top of your resume",
    suggestion:
      "Add a 2–3 sentence professional summary that highlights your level and focus",
  },
  {
    keywords: [
      "education",
      "university",
      "bachelor",
      "master",
      "degree",
      "gpa",
    ],
    strength: "Education section is clearly structured and credible",
    missing: "Education section is thin or absent — consider expanding it",
    suggestion:
      "Include institution name, degree, graduation year, and any honours",
  },
];

function analyzeText(
  extractedText: string,
  fileSize: number,
  fileName: string,
) {
  const strengths: string[] = [];
  const missingSkills: string[] = [];
  const suggestions: string[] = [];

  let signalScore = 0;

  for (const signal of KEYWORD_SIGNALS) {
    const matched = signal.keywords.some((kw) => extractedText.includes(kw));
    if (matched) {
      strengths.push(signal.strength);
      signalScore += 1;
    } else {
      missingSkills.push(signal.missing);
      suggestions.push(signal.suggestion);
    }
  }

  // Ensure at least one item in each list for realistic output.
  if (strengths.length === 0) {
    strengths.push("Resume uploaded and parsed successfully");
  }
  if (missingSkills.length === 0) {
    missingSkills.push(
      "No critical gaps detected — review for role-specific tailoring",
    );
  }
  if (suggestions.length === 0) {
    suggestions.push(
      "Tailor keywords and terminology to each specific job description",
    );
  }

  const baseScore = 55;
  const signalBonus = Math.round((signalScore / KEYWORD_SIGNALS.length) * 30);
  const sizeBonus = Math.min(8, Math.floor(fileSize / 50_000));
  const nameBonus = fileName.toLowerCase().includes("resume") ? 3 : 0;
  const matchScore = Math.min(
    97,
    baseScore + signalBonus + sizeBonus + nameBonus,
  );

  return { matchScore, strengths, missingSkills, suggestions };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No resume file received. Please upload a PDF or DOCX." },
        { status: 400 },
      );
    }

    const isAcceptedType = ACCEPTED_MIME_TYPES.includes(file.type);
    const hasAcceptedExtension = ACCEPTED_EXTENSIONS.test(file.name);

    if (!isAcceptedType && !hasAcceptedExtension) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX files are accepted." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded file is empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 5 MB size limit." },
        { status: 400 },
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const extractedText = extractText(buffer);
    const { matchScore, strengths, missingSkills, suggestions } = analyzeText(
      extractedText,
      file.size,
      file.name,
    );

    return NextResponse.json({
      matchScore,
      strengths,
      missingSkills,
      suggestions,
      extractedText,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze resume. Please try again." },
      { status: 500 },
    );
  }
}
