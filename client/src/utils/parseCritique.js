/**
 * The critic chain (ai-service/app/agents/pipeline.py) returns a fixed-format
 * block of text:
 *
 *   Score: 7/10
 *   Strengths:
 *   - ...
 *   Areas to Improve:
 *   - ...
 *   One line verdict:
 *   ...
 *
 * This turns that text into structured data so the UI can render the score
 * as its own visual element instead of dumping raw text.
 */
export function parseCritique(raw) {
  if (!raw) return null;

  const scoreMatch = raw.match(/score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

  const extractList = (sectionRegex) => {
    const match = raw.match(sectionRegex);
    if (!match) return [];
    return match[1]
      .split('\n')
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  };

  const strengths = extractList(/strengths:\s*([\s\S]*?)(?=areas to improve:|one line verdict:|$)/i);
  const improvements = extractList(/areas to improve:\s*([\s\S]*?)(?=one line verdict:|$)/i);

  const verdictMatch = raw.match(/one line verdict:\s*([\s\S]*)/i);
  const verdict = verdictMatch ? verdictMatch[1].trim() : null;

  return { score, strengths, improvements, verdict, raw };
}
