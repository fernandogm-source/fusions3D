const MAX_TOKENS = 5;
const MAX_TOKEN_LENGTH = 50;

const ACCENT_CLASSES = {
  a: 'aáàâä',
  e: 'eéèêë',
  i: 'iíìîï',
  o: 'oóòôö',
  u: 'uúùûü',
  n: 'nñ',
  c: 'cç'
};

const WORD_START = '(?:^|[\\s\\-_/(.,])';

/** Divide el texto de búsqueda en palabras normalizadas (minúsculas, sin espacios sobrantes). */
function tokenize(q) {
  return String(q ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_TOKENS)
    .map((token) => token.slice(0, MAX_TOKEN_LENGTH));
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Patrón que acepta la letra con o sin tilde (p. ej. "o" coincide con "ó"). */
function accentInsensitive(token) {
  return [...escapeRegex(token)]
    .map((char) => (ACCENT_CLASSES[char] ? `[${ACCENT_CLASSES[char]}]` : char))
    .join('');
}

function wordStartPattern(token) {
  return `${WORD_START}${accentInsensitive(token)}`;
}

/**
 * Filtro para `$match`: cada palabra debe coincidir con el inicio de una palabra
 * del nombre o de la descripción.
 */
function buildSearchMatch(tokens) {
  return {
    $and: tokens.map((token) => {
      const pattern = new RegExp(wordStartPattern(token), 'i');
      return { $or: [{ name: pattern }, { description: pattern }] };
    })
  };
}

/**
 * Expresión de relevancia para `$addFields`: 2 si el nombre empieza por la primera palabra,
 * 1 si alguna palabra del nombre empieza por ella, 0 en otro caso.
 */
function buildRelevanceExpression(firstToken) {
  const startsName = { $regexMatch: { input: '$name', regex: `^${accentInsensitive(firstToken)}`, options: 'i' } };
  const wordInName = { $regexMatch: { input: '$name', regex: wordStartPattern(firstToken), options: 'i' } };

  return { $cond: [startsName, 2, { $cond: [wordInName, 1, 0] }] };
}

module.exports = { tokenize, escapeRegex, accentInsensitive, buildSearchMatch, buildRelevanceExpression };
