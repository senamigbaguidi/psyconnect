// Détection de crise multi-signaux (mots-clés + intensité).
// Usage: serveur uniquement.

export type CrisisSeverity = "low" | "medium" | "high";

export interface CrisisSignal {
  detected: boolean;
  severity: CrisisSeverity;
  score: number;
  keywords: string[];
}

// Mots-clés multilingues (FR / EN / Fon / Goun).
// Pondération: 3 = action immédiate, 2 = idéation forte, 1 = détresse aiguë.
const CRISIS_LEXICON: Array<{ pattern: RegExp; weight: number; label: string }> = [
  // Action immédiate (poids 3)
  { pattern: /\b(me\s+suicid|me\s+tuer|me\s+pendre|me\s+jeter|sauter\s+du)\b/i, weight: 3, label: "passage_a_l_acte_fr" },
  { pattern: /\b(kill\s+myself|end\s+my\s+life|hang\s+myself|jump\s+off)\b/i, weight: 3, label: "passage_a_l_acte_en" },
  { pattern: /\b(ku\s+ɖe\s+so|hu\s+ɖe\s+ɖokpo)\b/i, weight: 3, label: "passage_a_l_acte_fon" },

  // Idéation suicidaire (poids 2)
  { pattern: /\b(suicide|suicidaire|en\s+finir|envie\s+de\s+mourir|disparaître|disparaitre)\b/i, weight: 2, label: "ideation_fr" },
  { pattern: /\b(suicidal|want\s+to\s+die|wanna\s+die|don'?t\s+want\s+to\s+live)\b/i, weight: 2, label: "ideation_en" },
  { pattern: /\b(idées?\s+noires?|pensées?\s+noires?)\b/i, weight: 2, label: "idees_noires" },

  // Automutilation (poids 2)
  { pattern: /\b(automutilation|me\s+couper|me\s+blesser|me\s+faire\s+mal)\b/i, weight: 2, label: "automutilation_fr" },
  { pattern: /\b(self[-\s]?harm|cut\s+myself|hurt\s+myself)\b/i, weight: 2, label: "automutilation_en" },

  // Détresse aiguë (poids 1)
  { pattern: /\b(je\s+n'?en\s+peux\s+plus|à\s+bout|au\s+bout\s+du\s+rouleau|plus\s+envie\s+de\s+vivre)\b/i, weight: 1, label: "detresse_fr" },
  { pattern: /\b(can'?t\s+go\s+on|no\s+reason\s+to\s+live|hopeless|worthless)\b/i, weight: 1, label: "detresse_en" },
  { pattern: /\b(plan\s+pour|j'?ai\s+les\s+moyens|j'?ai\s+un\s+plan)\b/i, weight: 2, label: "plan" },
];

// Amplificateurs d'intensité (multiplient le score).
const INTENSIFIERS = /\b(maintenant|ce\s+soir|cette\s+nuit|tonight|right\s+now|aujourd'hui\s+même|tout\s+de\s+suite)\b/i;
const NEGATORS = /\b(je\s+ne\s+veux\s+pas|je\s+ne\s+vais\s+pas|pas\s+vraiment|sans\s+vraiment|not\s+really)\b/i;

/**
 * Analyse un texte (message utilisateur ou réponse IA) et calcule un score de crise.
 * Le score combine la pondération des mots-clés + amplificateurs temporels.
 */
export function analyzeCrisis(text: string, aiFlagged = false): CrisisSignal {
  if (!text) return { detected: false, severity: "low", score: 0, keywords: [] };

  const matched: string[] = [];
  let score = 0;

  for (const entry of CRISIS_LEXICON) {
    if (entry.pattern.test(text)) {
      score += entry.weight;
      matched.push(entry.label);
    }
  }

  // Amplificateur temporel "maintenant", "ce soir" etc. → +2 si déjà signaux.
  if (score > 0 && INTENSIFIERS.test(text)) {
    score += 2;
    matched.push("intensifier_temporel");
  }

  // Atténuateur (négation explicite) → -1.
  if (NEGATORS.test(text) && score > 0) {
    score = Math.max(0, score - 1);
    matched.push("negator_present");
  }

  // Le marqueur IA compte aussi comme un signal fort (poids 2).
  if (aiFlagged) {
    score += 2;
    matched.push("ai_marker");
  }

  // Détermination de la sévérité.
  let severity: CrisisSeverity = "low";
  if (score >= 5) severity = "high";
  else if (score >= 3) severity = "medium";

  // Considéré comme crise dès que score >= 3 OU marqueur IA présent.
  const detected = score >= 3 || aiFlagged;

  return { detected, severity, score, keywords: matched };
}