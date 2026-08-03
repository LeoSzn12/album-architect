import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  EvaluationResult,
  MonopolyReport,
  EnergyMetrics,
  DraftedTrack,
  GameMode,
  CandidateRound,
} from '@/types/draft';
import { generateFallbackEvaluation } from '@/lib/fallbackEvaluator';
import { runBestPossibleOptimizer } from '@/lib/bestPossibleOptimizer';
import { rateLimit, rateLimitHeaders, requestRateLimitKey } from '@/lib/rateLimit';

/**
 * Minimal runtime shape guard. Throws on malformed payloads before they can
 * crash the prompt-template string interpolation. (Audit finding M6.)
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
    const limiter = rateLimit(requestRateLimitKey(req, 'critic-evaluate'), { limit: 12, windowMs: 60_000 });
    if (!limiter.allowed) return NextResponse.json({ error: 'Evaluation is temporarily rate limited. Please retry shortly.' }, { status: 429, headers: rateLimitHeaders(limiter) });
    const body = await req.json();
    const {
      gameMode,
      draftedTracks,
      monopolyReport,
      energyMetrics,
      candidateHistory,
      selectedEra,
    }: {
      gameMode: GameMode;
      draftedTracks: DraftedTrack[];
      monopolyReport: MonopolyReport;
      energyMetrics: EnergyMetrics;
      candidateHistory?: CandidateRound[];
      selectedEra?: string;
    } = body;

    if (!isValidPayload(draftedTracks, monopolyReport, energyMetrics)) {
      return NextResponse.json(
        { error: 'Malformed payload. Expected draftedTracks (non-empty) + monopolyReport + energyMetrics.' },
        { status: 400 }
      );
    }

    // ── Run best-possible optimizer (synchronous, <5ms for 7-round EP) ──
    // This runs on both the API path and the fallback path so the result
    // is always included regardless of whether Gemini is available.
    let optimizerResult: ReturnType<typeof runBestPossibleOptimizer> | undefined;
    if (Array.isArray(candidateHistory) && candidateHistory.length > 0) {
      try {
        optimizerResult = runBestPossibleOptimizer(draftedTracks, candidateHistory);
      } catch (optErr) {
        console.warn('Optimizer failed (non-fatal):', optErr);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const deterministicEvaluation = generateFallbackEvaluation(
      gameMode,
      draftedTracks,
      monopolyReport,
      energyMetrics,
      (selectedEra === 'all' || selectedEra === '2020s' || selectedEra === '2010s' || selectedEra === '2000s')
        ? selectedEra
        : 'all'
    );

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const trackSummary = draftedTracks
          .map(
            (t, i) =>
              `Track #${i + 1} (${t.slot.name}): "${t.song.title}" by ${
                t.song.rawArtistString
              } [BPM: ${t.song.bpm}, Energy: ${t.song.energy}%, Genre: ${t.song.genre}, Impact: ${(t.song.impact > 10 ? t.song.impact / 10 : t.song.impact)?.toFixed(1) ?? 'N/A'}]`
          )
          .join('\n');

        const prompt = `
You are an elite music A&R board consisting of 3 critics evaluating a ${
          gameMode === 'draft' ? 'seven-round TrackDraft match' : gameMode === 'ep' ? 'seven-track EP Builder' : '12–14-track Album Builder'
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

IMPORTANT: The scoring system uses these 4 categories (return EXACTLY these field names):
  - slotFit    (35%): How well each song's energy/genre fits its positional role
  - albumFlow  (25%): Energy & BPM progression; intentional vibe shifts allowed
  - cohesion   (20%): Genre consistency, mood arc, artist diversity
  - impact     (20%): Cultural recognition, acclaim, commercial strength

The overallScore MUST equal: 0.35*slotFit + 0.25*albumFlow + 0.20*cohesion + 0.20*impact, minus monopolyPenalty.

Critic Personas:
1. Marcus "The Boom-Bap Purist": Cares about lyrical depth, classic sequencing, opening & closing impact. Harshly penalizes artist monopoly.
2. Chloe "The Streaming Data Exec": Cares about skip-rate, playlisting potential, energy curve, streaming velocity.
3. Julian "The Late-Night Vibe Connoisseur": Cares about mood transitions, nocturnal feel, emotional resonance, aesthetic flow.

Return ONLY a valid JSON object with these EXACT fields:
{
  "overallScore": number (4.0 to 10.0, after monopoly deduction),
  "rawScore": number (weighted 0–10 before deduction),
  "monopolyPenalty": number,
  "gradeBadge": string (e.g. "Diamond Classic", "Platinum Banger", "Gold Solid", "A&R Scrapbook"),
  "subScores": {
    "slotFit": number (1–10),
    "albumFlow": number (1–10),
    "cohesion": number (1–10),
    "impact": number (1–10)
  },
  "reviews": [
    {
      "personaId": "purist",
      "name": "Marcus \"The Purist\"",
      "role": "Boom-Bap Historian & A&R Head",
      "score": number (1–10),
      "quote": string (1–2 sharp sentences in voice),
      "detailedAnalysis": string,
      "keyHighlight": string,
      "badge": string
    },
    {
      "personaId": "exec",
      "name": "Chloe \"Data Exec\"",
      "role": "Global Streaming Strategy Director",
      "score": number (1–10),
      "quote": string,
      "detailedAnalysis": string,
      "keyHighlight": string,
      "badge": string
    },
    {
      "personaId": "connoisseur",
      "name": "Julian \"Vibe Connoisseur\"",
      "role": "Nocturnal Music Curator & DJ",
      "score": number (1–10),
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
          parsed.source = 'gemini';
          // AI is commentary only. Competitive scores and evidence remain
          // deterministic so a model response cannot change the result.
          parsed.overallScore = deterministicEvaluation.overallScore;
          parsed.rawScore = deterministicEvaluation.rawScore;
          parsed.monopolyPenalty = deterministicEvaluation.monopolyPenalty;
          parsed.subScores = deterministicEvaluation.subScores;
          parsed.categoryScores = deterministicEvaluation.categoryScores;
          parsed.weightedScoreBeforePenalties = deterministicEvaluation.weightedScoreBeforePenalties;
          parsed.appliedPenalties = deterministicEvaluation.appliedPenalties;
          parsed.gradeBadge = deterministicEvaluation.gradeBadge;
          parsed.bestPossibleScore = deterministicEvaluation.bestPossibleScore;
          parsed.draftEfficiency = deterministicEvaluation.draftEfficiency;
          parsed.bestPossibleTracklist = deterministicEvaluation.bestPossibleTracklist;

          // Attach optimizer results if available
          if (optimizerResult) {
            parsed.bestPossibleScore     = optimizerResult.bestPossibleScore;
            parsed.draftEfficiency       = optimizerResult.draftEfficiency;
            parsed.bestPossibleTracklist = optimizerResult.bestPossibleTracklist;
            parsed.biggestMistake        = optimizerResult.biggestMistake  ?? undefined;
            parsed.smartestPick          = optimizerResult.smartestPick    ?? undefined;
          }

          return NextResponse.json(parsed);
        }
      } catch (genAiError) {
        console.warn('Gemini API call failed, using fallback:', genAiError);
      }
    }

    // ── Deterministic Fallback ──
    // Uses the canonical evaluator so server and client fallback produce
    // byte-identical results for the same draft. (Audit finding H4.)
    const fallback = generateFallbackEvaluation(
      gameMode,
      draftedTracks,
      monopolyReport,
      energyMetrics,
      (selectedEra === 'all' || selectedEra === '2020s' || selectedEra === '2010s' || selectedEra === '2000s')
        ? selectedEra
        : 'all'
    );

    // Attach optimizer results to fallback too
    if (optimizerResult) {
      fallback.bestPossibleScore     = optimizerResult.bestPossibleScore;
      fallback.draftEfficiency       = optimizerResult.draftEfficiency;
      fallback.bestPossibleTracklist = optimizerResult.bestPossibleTracklist;
      fallback.biggestMistake        = optimizerResult.biggestMistake  ?? undefined;
      fallback.smartestPick          = optimizerResult.smartestPick    ?? undefined;
    }

    return NextResponse.json(fallback);
  } catch (error) {
    console.error('Critic evaluation endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process critic evaluation' },
      { status: 500 }
    );
  }
}
