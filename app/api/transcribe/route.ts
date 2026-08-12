import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SPEECH_API_BASE = "https://speech.googleapis.com/v1";
const LANGUAGE_CODE = "es-PE"; // Hardcoded: no language selector in the UI.

type EncodingConfig = {
  encoding?: string;
  sampleRateHertz?: number;
};

function encodingFor(mimeType: string, filename: string): EncodingConfig {
  const name = filename.toLowerCase();
  const type = mimeType.toLowerCase();

  if (type.includes("webm") || name.endsWith(".webm")) {
    return { encoding: "WEBM_OPUS", sampleRateHertz: 48000 };
  }
  if (type.includes("ogg") || name.endsWith(".ogg")) {
    return { encoding: "OGG_OPUS", sampleRateHertz: 48000 };
  }
  if (type.includes("flac") || name.endsWith(".flac")) {
    return { encoding: "FLAC" };
  }
  if (type.includes("wav") || name.endsWith(".wav")) {
    return { encoding: "LINEAR16" };
  }
  if (type.includes("mpeg") || type.includes("mp3") || name.endsWith(".mp3")) {
    return { encoding: "MP3", sampleRateHertz: 44100 };
  }
  // Let the API try to infer it.
  return {};
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar la variable de entorno GOOGLE_API_KEY en el servidor." },
      { status: 500 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("audio");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No se recibió ningún audio." }, { status: 400 });
    }

    const filename = (file as File).name || "audio";
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const { encoding, sampleRateHertz } = encodingFor(file.type || "", filename);

    const body = {
      config: {
        ...(encoding ? { encoding } : {}),
        ...(sampleRateHertz ? { sampleRateHertz } : {}),
        languageCode: LANGUAGE_CODE,
        enableAutomaticPunctuation: true,
      },
      audio: { content: base64 },
    };

    const res = await fetch(`${SPEECH_API_BASE}/speech:longrunningrecognize?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Google rechazó la solicitud de transcripción." },
        { status: res.status }
      );
    }

    return NextResponse.json({ operationName: data.name });
  } catch (err) {
    return NextResponse.json({ error: "No se pudo procesar el audio enviado." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar la variable de entorno GOOGLE_API_KEY en el servidor." },
      { status: 500 }
    );
  }

  const operationName = req.nextUrl.searchParams.get("name");
  if (!operationName) {
    return NextResponse.json({ error: "Falta el identificador de la operación." }, { status: 400 });
  }

  try {
    const res = await fetch(`${SPEECH_API_BASE}/operations/${operationName}?key=${apiKey}`);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "No se pudo consultar el estado de la transcripción." },
        { status: res.status }
      );
    }

    if (!data.done) {
      return NextResponse.json({ done: false });
    }

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "La transcripción falló." },
        { status: 500 }
      );
    }

    const results = data.response?.results || [];
    const transcript = results
      .map((r: any) => r.alternatives?.[0]?.transcript || "")
      .filter(Boolean)
      .join(" ")
      .trim();

    return NextResponse.json({ done: true, transcript });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar el estado de la transcripción." }, { status: 500 });
  }
}
