import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { EvaluationResult, MonopolyReport, EnergyMetrics, DraftedTrack, GameMode } from '@/types/draft';
import { generateFallbackEvaluation } from '@/lib/fallbackEvaluator';

/**
 * Minimal runtime shape guard. Throws on malformed payloads before they can
 * crash the prompt-template string interpolation (e.g. `monopolyReport.penalizedArtists.map`
 * on `undefined`). Full schema validation (zod) is a tracked follow-up, but
 * this guard lets malformed requests fall through to the deterministic
 * fallback with a 200 response rather than a generic 500. (Audit finding M6.)
 */
function isValidPayload(
  draftedTracks: unknown,
  monopolyReport: unknown,
  energyMetrics: unknown
): boolean {
  return (
    Array.isArray(draftedTracks) &&
    draftedTracks.length > 0 &&
    monopolyReport !== null &&
    typeof monopolyReport === 'object' &&
    Array.isArray((monopolyReport as MonopolyReport)?.penalizedArtists) &&
    energyMetrics !== null &&
    typeof energyMetrics === 'object' &&
    typeof (energyMetrics as EnergyMetrics)?.avgEnergy === 'number'
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gameMode,
      draftedTracks,
      monopolyReport,
      energyMetrics,
    }: {
      gameMode: GameMode;
      draftedTracks: DraftedTrack[];
      monopolyReport: MonopolyReport;
      energyMetrics: EnergyMetrics;
    } = body;

    if (!isValidPayload(draftedTracks, monopolyReport, energyMetrics)) {
      return NextResponse.json(
        { error: 'Malformed payload. Expected draftedTracks (non-empty) + monopolyReport + energyMetrics.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const trackSummary = draftedTracks
          .map(
            (t, i) =>
              `Track #${i + 1} (${t.slot.name}): "${t.song.title}" by ${
                t.song.rawArtistString
              } [BPM: ${t.song.bpm}, Energy: ${t.song.energy}%, Genre: ${t.song.genre}]`
          )
          .join('\n');

        const prompt = `
You are an elite music A&R board consisting of 3 critics evaluating a ${
          gameMode === 'ep' ? '6-track Quick EP' : '14-track Full Album'
        } fantasy draft.

Drafted Tracklist:
${trackSummary}

Monopoly Penalty Status:
- Has Solo Artist Monopoly Violation: ${monopolyReport.hasViolation}
- Solo Monopoly Deduction Points: ${monopolyReport.totalPenaltyDeduction}
- Penalized Solo Artists: ${
          monopolyReport.penalizedArtists
            .map((p) => `${p.artist} (${p.soloCount} solo tracks)`)
            .join(', ') || 'None'
        }

Energy Pacing Metrics:
- Average Energy: ${energyMetrics.avgEnergy}%
- Fatigue Status: ${energyMetrics.status}

Rules & Persona Profiles:
1. Marcus "The Boom-Bap Purist": Cares about lyrical depth, classic sequencing, opening & closing impact, and harshly penalizes lazy artist repeat monopoly picks.
2. Chloe "The Streaming Data Exec": Cares about skip-rate minimization, playlisting potential, energy curve stability, and streaming velocity.
3. Julian "The Late-Night Vibe Connoisseur": Cares about mood transitions, nocturnal R&B feel, emotional resonance, and aesthetic flow.

Return ONLY a valid JSON object matching this TypeScript format:
{
  "overallScore": number (4.0 to 10.0),
  "rawScore": number (0 to 10),
  "monopolyPenalty": number,
  "gradeBadge": string (e.g. "Diamond Classic", "Platinum Banger", "Gold Solid", "A&R Scrapbook"),
  "subScores": {
    "pacing": number (1-10),
    "synergy": number (1-10),
    "cohesion": number (1-10),
    "starPower": number (1-10)
  },
  "reviews": [
    {
      "personaId": "purist",
      "name": "Marcus \"The Purist\"",
      "role": "Boom-Bap Historian & A&R Head",
      "score": number (1-10),
      "quote": string (1-2 sharp sentences in voice),
      "detailedAnalysis": string,
      "keyHighlight": string,
      "badge": string
    },
    {
      "personaId": "exec",
      "name": "Chloe \"Data Exec\"",
      "role": "Global Streaming Strategy Director",
      "score": number (1-10),
      "quote": string,
      "detailedAnalysis": string,
      "keyHighlight": string,
      "badge": string
    },
    {
      "personaId": "connoisseur",
      "name": "Julian \"Vibe Connoisseur\"",
      "role": "Nocturnal Music Curator & DJ",
      "score": number (1-10),
      "quote": string,
      "detailedAnalysis": string,
      "keyHighlight": string,
      "badge": string
    }
  ],
  "highlights": [string, string]
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const responseText = response.text;
        if (responseText) {
          const parsed = JSON.parse(responseText) as EvaluationResult;
          parsed.monopolyReport = monopolyReport;
          parsed.energyMetrics = energyMetrics;
          // Stamp provenance so the scorecard can badge this as an AI Critic Board score.
          parsed.source = 'gemini';
          return NextResponse.json(parsed);
        }
      } catch (genAiError) {
        console.warn('Gemini API call failed, using fallback:', genAiError);
      }
    }

    // Deterministic Fallback Evaluator if no API key or call fails.
    // Uses the canonical evaluator in src/lib/fallbackEvaluator.ts so the
    // server fallback and the client store fallback produce byte-identical
    // results for the same draft. (Audit finding H4.)
    const fallback = generateFallbackEvaluation(
      gameMode,
      draftedTracks,
      monopolyReport,
      energyMetrics,
      // Era filter is not currently sent by the client; default to 'all' so
      // optimal picks scan the full library. The store's own fallback path
      // passes the live selectedEra."
      'all'
    );

    return NextResponse.json(fallback);
  } catch (error) {
    console.error('Critic evaluation endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process critic evaluation' },
      { status: 500 }
    );
  }
}

/*
 * The fallback evaluator previously lived here as a duplicate of the
 * client-side evaluator in src/store/useDraftStore.ts, with divergent
 * formulas (hardcoded rawScore: 9.5, different sub-score weights, different
 * persona quotes/badges). The same draft produced *different* scores depending
 * on whether the network request succeeded.
 *
 * The canonical evaluator now lives at src/lib/fallbackEvaluator.ts and is
 * imported by both this route and the store, guaranteeing byte-identical
 * fallback results regardless of the network path. (Audit finding H4.)
 */
