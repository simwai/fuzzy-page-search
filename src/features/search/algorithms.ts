export function damerauLevenshteinSimilarity(
  first: string,
  second: string
): number {
  if (first === second) return 1.0;
  const firstLength = first.length;
  const secondLength = second.length;
  if (firstLength === 0 && secondLength === 0) return 1;
  if (firstLength === 0 || secondLength === 0) return 0;

  const [shorter, longer, minLength, maxLength] =
    firstLength > secondLength
      ? [second, first, secondLength, firstLength]
      : [first, second, firstLength, secondLength];

  let twoRowsBack = Array(maxLength + 1).fill(0);
  let previousRow = Array(maxLength + 1)
    .fill(0)
    .map((_, index) => index);
  let currentRow = Array(maxLength + 1).fill(0);

  for (let firstIndex = 1; firstIndex <= minLength; firstIndex++) {
    currentRow[0] = firstIndex;
    for (let secondIndex = 1; secondIndex <= maxLength; secondIndex++) {
      const cost = shorter[firstIndex - 1] === longer[secondIndex - 1] ? 0 : 1;
      let minEdit = Math.min(
        previousRow[secondIndex] + 1,
        currentRow[secondIndex - 1] + 1,
        previousRow[secondIndex - 1] + cost
      );
      if (
        firstIndex > 1 &&
        secondIndex > 1 &&
        shorter[firstIndex - 1] === longer[secondIndex - 2] &&
        shorter[firstIndex - 2] === longer[secondIndex - 1]
      ) {
        minEdit = Math.min(minEdit, twoRowsBack[secondIndex - 2] + 1);
      }
      currentRow[secondIndex] = minEdit;
    }
    [twoRowsBack, previousRow, currentRow] = [
      previousRow,
      currentRow,
      twoRowsBack,
    ];
  }
  return 1 - previousRow[maxLength] / Math.max(firstLength, secondLength);
}

export function smartSimilarity(query: string, text: string): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const textLength = text.length;

  if (textLower.includes(queryLower)) {
    const lengthRatio = queryLower.length / textLength;
    const lengthPenalty = lengthRatio ** 0.3;
    const score = 0.7 + 0.3 * lengthPenalty;
    return Math.max(0.7, Math.min(1.0, score));
  }

  const words = textLower.split(/\s+/).filter((w) => w.length >= 2);
  let bestWordScore = 0;

  for (const word of words) {
    const score = damerauLevenshteinSimilarity(queryLower, word);
    if (score > bestWordScore) {
      bestWordScore = score;
    }
    if (score === 1.0) break;
  }

  return bestWordScore;
}
