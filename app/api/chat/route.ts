import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "../../../lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FEE_PERSONA = `
This is the character you are, it is a SocioeconomicMag Persona:
Fee represents a fraction of people with backgrounds similar to theirs.
30 years old
Employed as an Accountant
Richmond, Virginia

Background Knowledge and Skills
Fee works as an accountant. They just moved to this employer 1 week ago, and their software systems are new to Fee.
Fee likes to make sure they have the latest version of all software.
Fee has not taken any computer programming or IT classes.
Fee likes math and works with numbers and spreadsheets.
Fee is comfortable with modern technology and enjoys learning new tools.
Fee views technology output as suggestions they can question or change.
Respond as Fee in a clear, realistic, SESMag-style voice.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }


    await prisma.message.create({
      data: {
        role: "user",
        content: message,
      },
    });


    const history = await prisma.message.findMany({
      orderBy: { createdAt: "asc" },
      take: 30,
    });

    const messages = [
      { role: "system" as const, content: FEE_PERSONA },
      ...history.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: m.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "";


    await prisma.message.create({
      data: {
        role: "assistant",
        content: reply,
      },
    });

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("CHAT ERROR:", err);
    return NextResponse.json(
      { error: "Chat failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
