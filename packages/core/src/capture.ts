import { clampPriority, type CaptureItem, type Project } from './model';
import { normalizeTags } from './tags';

/** Keyword heuristics keyed by lowercase project-name fragments. */
export const PROJECT_KEYWORDS: Array<{ nameMatch: RegExp; text: RegExp }> = [
  { nameMatch: /research|ai/i, text: /claude|prompt|research|ai |model|embedding|эмбеддинг|промпт/i },
  { nameMatch: /build|app|headboard/i, text: /headboard|app|prototype|build|code|sync|api|приложени/i },
  { nameMatch: /writ/i, text: /write|writ|essay|draft|blog|post|стать|текст|эссе/i },
  { nameMatch: /home|ops/i, text: /home|clean|plant|tax|account|renew|domain|bill|дом|домен|счет|налог/i },
  { nameMatch: /health/i, text: /health|doctor|dentist|gym|run|sleep|врач|зуб|спорт|сон/i },
];

export function guessProject(line: string, projects: Project[]): string | null {
  for (const p of projects) {
    // direct mention of the project name wins
    if (new RegExp(p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(line)) return p.id;
  }
  for (const rule of PROJECT_KEYWORDS) {
    if (!rule.text.test(line)) continue;
    const p = projects.find(pp => rule.nameMatch.test(pp.name));
    if (p) return p.id;
  }
  return null;
}

/** Offline task extraction: one task per line, urgency & #tags detection. */
export function heuristicExtract(text: string, projects: Project[]): CaptureItem[] {
  return text
    .split(/\n+|(?:;\s+)/)
    .map(l => l.replace(/^[\s\-–—\*•\[\]x]+/i, '').trim())
    .filter(l => l.length > 2)
    .slice(0, 8)
    .map(l => {
      const tags = (l.match(/#([\wа-яё]+)/gi) || []).map(x => x.slice(1).toLowerCase());
      let title = l.replace(/#[\wа-яё]+/gi, '').replace(/\s+/g, ' ').trim();
      const urgent = /urgent|asap|today|срочно|сегодня/i.test(title);
      title = title.replace(/^(urgent|asap|срочно)[:\s]+/i, '');
      title = title.charAt(0).toUpperCase() + title.slice(1);
      return { title: title.slice(0, 90), pr: clampPriority(urgent ? 0 : 1), tags: normalizeTags(tags).slice(0, 2), proj: guessProject(l, projects) };
    });
}

/** Prompt for the AI extraction endpoint. */
export function extractPrompt(text: string, projects: Project[]): string {
  const pn = projects.map(p => '"' + p.name + '"').join(', ');
  return 'Extract actionable tasks from the text below. Respond with ONLY a JSON array, no prose. Each item: {"title": short imperative string in the same language as the input, "priority": 0|1|2 (0=high, 1=medium, 2=low), "tags": array of 0-2 lowercase single words, "project": one of [' + pn + '] or null}.\n\nTEXT:\n' + text;
}

/** Parse the model's JSON answer into CaptureItems; returns [] on failure. */
export function parseExtractResponse(raw: string, projects: Project[]): CaptureItem[] {
  try {
    const j = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1)) as Array<Record<string, unknown>>;
    return j.map(x => ({
      title: String(x.title || '').slice(0, 90),
      pr: clampPriority(Number(x.priority) || 0),
      tags: Array.isArray(x.tags) ? normalizeTags(x.tags.map(String)).slice(0, 2) : [],
      proj: projects.find(p => p.name === x.project)?.id ?? null,
    })).filter(x => x.title);
  } catch {
    return [];
  }
}
