import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CoverLetterRequest = {
  companyName?: unknown;
  role?: unknown;
  jobDescription?: unknown;
  strengths?: unknown;
  matchedSkills?: unknown;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

// ---------------------------------------------------------------------------
// Cover letter generator
// ---------------------------------------------------------------------------

function buildCoverLetter(
  companyName: string,
  role: string,
  jobDescription: string,
  strengths: string[],
  matchedSkills: string[],
): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const topSkills = matchedSkills.slice(0, 3);
  const topStrengths = strengths.slice(0, 2);

  const intro = `I am writing to express my strong interest in the ${role} position at ${companyName}. After reviewing the opportunity carefully, I am confident that my background and experience make me a strong fit for your team.`;

  const skillsPara =
    topSkills.length > 0
      ? `My hands-on experience with ${topSkills.join(", ")} aligns directly with the core requirements of this position. I have consistently applied these skills to deliver measurable, high-quality outcomes in collaborative environments, and I look forward to bringing that same focus to ${companyName}.`
      : `I bring a strong technical and collaborative foundation that aligns well with what you are looking for. I thrive in environments that demand careful problem-solving, clear communication, and a high standard of craft.`;

  const strengthsPara =
    topStrengths.length > 0
      ? `My work is consistently marked by ${topStrengths[0].toLowerCase()}${topStrengths.length > 1 ? ` and ${topStrengths[1].toLowerCase()}` : ""}. I believe these qualities are directly relevant to the challenges your team is navigating and would allow me to make a genuine contribution from day one at ${companyName}.`
      : `Throughout my career I have focused on delivering clear, measurable outcomes while maintaining a high standard of collaboration and communication. I am excited by the prospect of contributing that same energy to ${companyName}.`;

  const jdPara =
    jobDescription.length > 30
      ? `Having reviewed the role description in detail, I am particularly drawn to the scope of this position and the opportunity to work alongside a skilled team at ${companyName}. The combination of my technical background and collaborative approach makes me a strong fit for what you are looking for.`
      : "";

  const closing = `I would welcome the opportunity to discuss how my experience aligns with your goals at ${companyName}. Thank you very much for considering my application — I look forward to speaking with you.\n\nSincerely,\n[Your Name]`;

  const parts = [
    today,
    "",
    "Dear Hiring Manager,",
    "",
    intro,
    "",
    skillsPara,
    "",
    strengthsPara,
    ...(jdPara ? ["", jdPara] : []),
    "",
    closing,
  ];

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CoverLetterRequest;

    if (typeof body.companyName !== "string" || !body.companyName.trim()) {
      return NextResponse.json(
        { error: "companyName is required." },
        { status: 400 },
      );
    }

    if (typeof body.role !== "string" || !body.role.trim()) {
      return NextResponse.json({ error: "role is required." }, { status: 400 });
    }

    const companyName = body.companyName.trim();
    const role = body.role.trim();
    const jobDescription =
      typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
    const strengths = toStringArray(body.strengths);
    const matchedSkills = toStringArray(body.matchedSkills);

    // Simulate a realistic generation delay.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const coverLetter = buildCoverLetter(
      companyName,
      role,
      jobDescription,
      strengths,
      matchedSkills,
    );

    return NextResponse.json({ coverLetter });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate cover letter. Please try again." },
      { status: 500 },
    );
  }
}
