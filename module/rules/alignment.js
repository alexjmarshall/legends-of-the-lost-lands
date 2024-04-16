export const ALIGNMENTS = {
  LG: 'Lawful Good',
  CG: 'Chaotic Good',
  N: 'Neutral',
  LE: 'Lawful Evil',
  CE: 'Chaotic Evil',
};

export const alignmentDescriptions = {
  [ALIGNMENTS.LG]: 'Highly principled. Will not lie or steal and strives to protect the innocent.',
  [ALIGNMENTS.CG]:
    'Believes a good heart is a better guide than rigid law. Tends to believe that the end justifies the means.',
  [ALIGNMENTS.N]: 'Believes in balance, or that one should simply follow the laws and customs of their society.',
  [ALIGNMENTS.LE]:
    'Out to gain for themselves even at cost to others. May believe it is the right of the strong to rule the weak.',
  [ALIGNMENTS.CE]: 'Revels in destruction for its own sake. Both dangerous and unpredictable.',
};

export const allAlignments = Object.values(ALIGNMENTS);

export const allExceptLawfulGood = allAlignments.filter((a) => a !== ALIGNMENTS.LG);

export const chaoticAlignments = [ALIGNMENTS.CG, ALIGNMENTS.CE];

export const lawfulAlignments = [ALIGNMENTS.LG, ALIGNMENTS.LE];

export const goodAlignments = [ALIGNMENTS.LG, ALIGNMENTS.CG];

export const evilAlignments = [ALIGNMENTS.LE, ALIGNMENTS.CE];

export const minScore = {
  [ALIGNMENTS.LG]: 17,
  [ALIGNMENTS.CG]: 13,
  [ALIGNMENTS.N]: 9,
  [ALIGNMENTS.LE]: 5,
  [ALIGNMENTS.CE]: 1,
};

export const alignmentByScore = (score) => {
  if (score >= minScore[ALIGNMENTS.LG]) return ALIGNMENTS.LG;
  if (score >= minScore[ALIGNMENTS.CG]) return ALIGNMENTS.CG;
  if (score >= minScore[ALIGNMENTS.N]) return ALIGNMENTS.N;
  if (score >= minScore[ALIGNMENTS.LE]) return ALIGNMENTS.LE;
  return ALIGNMENTS.CE;
};
