import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { jobDescription, resumeText } = await req.json();

    if (!jobDescription || !resumeText) {
      return NextResponse.json({ error: "Missing inputs" }, { status: 400 });
    }

    const skills = ["React", "Next.js", "JavaScript", "UI/UX", "API", "SQL"];

    const matchedSkills = skills.filter(
      (skill) =>
        resumeText.toLowerCase().includes(skill.toLowerCase()) &&
        jobDescription.toLowerCase().includes(skill.toLowerCase()),
    );

    const missingSkills = skills.filter(
      (skill) =>
        jobDescription.toLowerCase().includes(skill.toLowerCase()) &&
        !resumeText.toLowerCase().includes(skill.toLowerCase()),
    );

    const matchScore = Math.min(
      100,
      60 + matchedSkills.length * 8 - missingSkills.length * 3,
    );

    return NextResponse.json({
      matchScore,
      matchedSkills,
      missingSkills,
      suggestions: [
        "Highlight relevant skills in your resume",
        "Add measurable achievements",
        "Tailor your resume to the job description",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
