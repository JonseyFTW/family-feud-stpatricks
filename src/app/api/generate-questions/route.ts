import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const { category, count = 3 } = await request.json();

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const questionsToGenerate = Math.min(Math.max(1, count), 10);

    const prompt = `You are generating questions for a Family Feud style game show.

Given the category: "${category}"

Generate ${questionsToGenerate} survey-style questions that would work for Family Feud. For each question, provide 5-8 answers ranked by how many people out of 100 would likely give that answer. The points for all answers in a question should add up to a number between 80 and 100.

IMPORTANT: Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text. Return exactly this structure:
[
  {
    "question": "the survey question",
    "answers": [
      { "text": "answer 1", "points": 35 },
      { "text": "answer 2", "points": 25 },
      { "text": "answer 3", "points": 15 },
      { "text": "answer 4", "points": 10 },
      { "text": "answer 5", "points": 8 }
    ]
  }
]

Make the questions fun and entertaining. Answers should be ordered from most popular (highest points) to least popular (lowest points). Each answer's points represent how many people out of 100 would give that answer.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 502 });
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json({ error: 'No content in AI response' }, { status: 502 });
    }

    // Parse the JSON from the response, stripping any markdown code blocks
    const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(cleanedText);

    // Validate and format the questions
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 502 });
    }

    const formattedQuestions = questions.map((q: { question: string; answers: { text: string; points: number }[] }, index: number) => ({
      id: `ai-${Date.now()}-${index}`,
      question: q.question,
      answers: q.answers.map((a: { text: string; points: number }) => ({
        text: a.text,
        points: typeof a.points === 'number' ? a.points : parseInt(a.points) || 5,
      })),
      isUsed: false,
    }));

    return NextResponse.json({ questions: formattedQuestions });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
