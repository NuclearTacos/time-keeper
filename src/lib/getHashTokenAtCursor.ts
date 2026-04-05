interface HashToken {
  /** The partial tag text after #, lowercased */
  query: string;
  /** Index of the # character in the string */
  startIndex: number;
  /** Index after the last character of the token */
  endIndex: number;
}

/**
 * Finds the #tag token at the given cursor position in an input string.
 * Returns null if the cursor is not inside a #token.
 */
export function getHashTokenAtCursor(value: string, cursorPos: number): HashToken | null {
  // Walk backwards from cursor to find #
  let hashIndex = -1;
  for (let i = cursorPos - 1; i >= 0; i--) {
    const ch = value[i];
    if (ch === "#") {
      // Valid if at start of string or preceded by whitespace
      if (i === 0 || /\s/.test(value[i - 1])) {
        hashIndex = i;
      }
      break;
    }
    if (/\s/.test(ch)) break; // hit whitespace before finding #
  }

  if (hashIndex === -1) return null;

  // Walk forward from cursor to find end of token
  let endIndex = cursorPos;
  while (endIndex < value.length && !/\s/.test(value[endIndex])) {
    endIndex++;
  }

  const query = value.slice(hashIndex + 1, cursorPos).toLowerCase();
  return { query, startIndex: hashIndex, endIndex };
}
