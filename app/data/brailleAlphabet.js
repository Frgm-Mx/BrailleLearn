// ============================================================
// BRAILLE ALPHABET — Sistema Braille español (Comisión Braille ONCE)
//
// Indicadores verificados:
//   Mayúscula : puntos 4 y 6  (columna derecha, centro e inferior)
//   Número    : puntos 3,4,5,6 (col. izq. inf. + col. der. completa)
//
// Fuentes: ONCE (once.es), Comisión Braille Española,
//          cienciaaciegas.com, digrande.it/es braille español
// ============================================================

export const INDICATORS = {
  capital: {
    dots: [4, 6],
    description: "Indicador de mayúscula. Puntos 4 y 6: columna derecha, posiciones central e inferior.",
    audio: "indicador_mayuscula",
  },
  number: {
    dots: [3, 4, 5, 6],
    description: "Indicador numérico. Puntos 3, 4, 5 y 6: todos excepto el 1 y el 2.",
    audio: "indicador_numero",
  },
};

export const brailleAlphabet = {
  A: { dots: [1],             audio: "letra_a", description: "Letra A. Punto 1, arriba izquierda.",                category: "vowel"     },
  B: { dots: [1, 2],          audio: "letra_b", description: "Letra B. Puntos 1 y 2, columna izquierda superior.", category: "consonant" },
  C: { dots: [1, 4],          audio: "letra_c", description: "Letra C. Puntos 1 y 4, fila superior.",              category: "consonant" },
  D: { dots: [1, 4, 5],       audio: "letra_d", description: "Letra D. Puntos 1, 4 y 5.",                          category: "consonant" },
  E: { dots: [1, 5],          audio: "letra_e", description: "Letra E. Puntos 1 y 5.",                             category: "vowel"     },
  F: { dots: [1, 2, 4],       audio: "letra_f", description: "Letra F. Puntos 1, 2 y 4.",                          category: "consonant" },
  G: { dots: [1, 2, 4, 5],    audio: "letra_g", description: "Letra G. Puntos 1, 2, 4 y 5.",                       category: "consonant" },
  H: { dots: [1, 2, 5],       audio: "letra_h", description: "Letra H. Puntos 1, 2 y 5.",                          category: "consonant" },
  I: { dots: [2, 4],          audio: "letra_i", description: "Letra I. Puntos 2 y 4.",                             category: "vowel"     },
  J: { dots: [2, 4, 5],       audio: "letra_j", description: "Letra J. Puntos 2, 4 y 5.",                          category: "consonant" },
  K: { dots: [1, 3],          audio: "letra_k", description: "Letra K. Puntos 1 y 3.",                             category: "consonant" },
  L: { dots: [1, 2, 3],       audio: "letra_l", description: "Letra L. Puntos 1, 2 y 3, columna izquierda.",       category: "consonant" },
  M: { dots: [1, 3, 4],       audio: "letra_m", description: "Letra M. Puntos 1, 3 y 4.",                          category: "consonant" },
  N: { dots: [1, 3, 4, 5],    audio: "letra_n", description: "Letra N. Puntos 1, 3, 4 y 5.",                       category: "consonant" },
  O: { dots: [1, 3, 5],       audio: "letra_o", description: "Letra O. Puntos 1, 3 y 5.",                          category: "vowel"     },
  P: { dots: [1, 2, 3, 4],    audio: "letra_p", description: "Letra P. Puntos 1, 2, 3 y 4.",                       category: "consonant" },
  Q: { dots: [1, 2, 3, 4, 5], audio: "letra_q", description: "Letra Q. Puntos 1, 2, 3, 4 y 5.",                   category: "consonant" },
  R: { dots: [1, 2, 3, 5],    audio: "letra_r", description: "Letra R. Puntos 1, 2, 3 y 5.",                       category: "consonant" },
  S: { dots: [2, 3, 4],       audio: "letra_s", description: "Letra S. Puntos 2, 3 y 4.",                          category: "consonant" },
  T: { dots: [2, 3, 4, 5],    audio: "letra_t", description: "Letra T. Puntos 2, 3, 4 y 5.",                       category: "consonant" },
  U: { dots: [1, 3, 6],       audio: "letra_u", description: "Letra U. Puntos 1, 3 y 6.",                          category: "vowel"     },
  V: { dots: [1, 2, 3, 6],    audio: "letra_v", description: "Letra V. Puntos 1, 2, 3 y 6.",                       category: "consonant" },
  W: { dots: [2, 4, 5, 6],    audio: "letra_w", description: "Letra W. Puntos 2, 4, 5 y 6.",                       category: "consonant" },
  X: { dots: [1, 3, 4, 6],    audio: "letra_x", description: "Letra X. Puntos 1, 3, 4 y 6.",                       category: "consonant" },
  Y: { dots: [1, 3, 4, 5, 6], audio: "letra_y", description: "Letra Y. Puntos 1, 3, 4, 5 y 6.",                   category: "consonant" },
  Z: { dots: [1, 3, 5, 6],    audio: "letra_z", description: "Letra Z. Puntos 1, 3, 5 y 6.",                       category: "consonant" },
};

export const brailleNumbers = {
  "1": { dots: [1],          baseLetter: "A", audio: "numero_1", description: "Número 1. Mismo patrón que la letra A." },
  "2": { dots: [1, 2],       baseLetter: "B", audio: "numero_2", description: "Número 2. Mismo patrón que la letra B." },
  "3": { dots: [1, 4],       baseLetter: "C", audio: "numero_3", description: "Número 3. Mismo patrón que la letra C." },
  "4": { dots: [1, 4, 5],    baseLetter: "D", audio: "numero_4", description: "Número 4. Mismo patrón que la letra D." },
  "5": { dots: [1, 5],       baseLetter: "E", audio: "numero_5", description: "Número 5. Mismo patrón que la letra E." },
  "6": { dots: [1, 2, 4],    baseLetter: "F", audio: "numero_6", description: "Número 6. Mismo patrón que la letra F." },
  "7": { dots: [1, 2, 4, 5], baseLetter: "G", audio: "numero_7", description: "Número 7. Mismo patrón que la letra G." },
  "8": { dots: [1, 2, 5],    baseLetter: "H", audio: "numero_8", description: "Número 8. Mismo patrón que la letra H." },
  "9": { dots: [2, 4],       baseLetter: "I", audio: "numero_9", description: "Número 9. Mismo patrón que la letra I." },
  "0": { dots: [2, 4, 5],    baseLetter: "J", audio: "numero_0", description: "Número 0. Mismo patrón que la letra J." },
};

export const braillePunctuation = {
  ",":  { dots: [2],             audio: "coma",          description: "Coma. Punto 2."                                 },
  ";":  { dots: [2, 3],          audio: "punto_coma",    description: "Punto y coma. Puntos 2 y 3."                   },
  ":":  { dots: [2, 5],          audio: "dos_puntos",    description: "Dos puntos. Puntos 2 y 5."                     },
  ".":  { dots: [2, 5, 6],       audio: "punto",         description: "Punto final. Puntos 2, 5 y 6."                },
  "!":  { dots: [2, 3, 5],       audio: "admiracion",    description: "Admiración. Puntos 2, 3 y 5."                 },
  "?":  { dots: [2, 6],          audio: "interrogacion", description: "Interrogación. Puntos 2 y 6."                 },
  "-":  { dots: [3, 6],          audio: "guion",         description: "Guión. Puntos 3 y 6."                         },
  "\"": { dots: [2, 3, 5, 6],    audio: "comillas",      description: "Comillas. Puntos 2, 3, 5 y 6."               },
  "(":  { dots: [1, 2, 3, 5, 6], audio: "parentesis_a",  description: "Paréntesis apertura. Puntos 1, 2, 3, 5 y 6." },
  ")":  { dots: [2, 3, 4, 5, 6], audio: "parentesis_c",  description: "Paréntesis cierre. Puntos 2, 3, 4, 5 y 6."  },
  " ":  { dots: [],              audio: "espacio",        description: "Espacio. Ningún punto activo."                },
};

export const brailleAccented = {
  "Á": { dots: [1, 2, 3, 5, 6],   audio: "letra_a_acento",   description: "Letra Á. Puntos 1, 2, 3, 5 y 6.", category: "vowel"     },
  "É": { dots: [2, 3, 4, 6],      audio: "letra_e_acento",   description: "Letra É. Puntos 2, 3, 4 y 6.",   category: "vowel"     },
  "Í": { dots: [3, 4],             audio: "letra_i_acento",   description: "Letra Í. Puntos 3 y 4.",          category: "vowel"     },
  "Ó": { dots: [3, 4, 6],          audio: "letra_o_acento",   description: "Letra Ó. Puntos 3, 4 y 6.",      category: "vowel"     },
  "Ú": { dots: [2, 3, 4, 5, 6],   audio: "letra_u_acento",   description: "Letra Ú. Puntos 2, 3, 4, 5 y 6.", category: "vowel"    },
  "Ü": { dots: [1, 2, 5, 6],       audio: "letra_u_dieresis", description: "Letra Ü. Puntos 1, 2, 5 y 6.",   category: "vowel"     },
  "Ñ": { dots: [1, 2, 4, 5, 6],   audio: "letra_enie",       description: "Letra Ñ. Puntos 1, 2, 4, 5 y 6.", category: "consonant" },
};

const letterKeys      = Object.keys(brailleAlphabet);
const accentedKeys    = Object.keys(brailleAccented);
const numberKeys      = Object.keys(brailleNumbers);
const punctuationKeys = Object.keys(braillePunctuation).filter((k) => k !== " ");

export const categories = {
  vowels:            ["A", "E", "I", "O", "U"],
  consonants:        letterKeys.filter((l) => brailleAlphabet[l].category === "consonant"),
  all:               letterKeys,
  lowercase:         letterKeys,
  uppercase:         letterKeys,
  numbers:           numberKeys,
  punctuation:       punctuationKeys,
  accented:          accentedKeys,
  indicators:        Object.keys(INDICATORS),
  lettersAndNumbers: [...letterKeys, ...numberKeys],
  fullSpanish:       [...letterKeys, ...accentedKeys],
  full:              [...new Set([...letterKeys, ...accentedKeys, ...numberKeys, ...punctuationKeys])],
};

export class BrailleContext {
  constructor() { this.reset(); }

  reset() {
    this.mode     = "letter";
    this.sequence = [];
  }

  interpret(dots) {
    const dotsStr = [...dots].sort().join(",");

    if (dotsStr === "4,6") {
      this.mode = "capital";
      return { type: "indicator", name: "capital", speak: "Indicador de mayúscula." };
    }
    if (dotsStr === "3,4,5,6") {
      this.mode = "number";
      return { type: "indicator", name: "number", speak: "Modo número activado." };
    }

    if (this.mode === "number") {
      const match = Object.entries(brailleNumbers).find(
        ([, d]) => [...d.dots].sort().join(",") === dotsStr
      );
      if (match) {
        const [num, data] = match;
        this.sequence.push({ type: "number", value: num });
        return { type: "number", value: num, speak: `Número ${num}.`, description: data.description };
      }
      this.mode = "letter";
    }

    if (this.mode === "capital") {
      this.mode = "letter";
      const match = Object.entries(brailleAlphabet).find(
        ([, d]) => [...d.dots].sort().join(",") === dotsStr
      );
      if (match) {
        const [letter] = match;
        this.sequence.push({ type: "capital", value: letter });
        return { type: "capital", value: letter, speak: `${letter} mayúscula.` };
      }
    }

    for (const [table, type] of [
      [brailleAlphabet,    "letter"],
      [brailleAccented,    "accented"],
      [braillePunctuation, "punctuation"],
    ]) {
      const match = Object.entries(table).find(
        ([, d]) => [...d.dots].sort().join(",") === dotsStr
      );
      if (match) {
        const [char, data] = match;
        this.sequence.push({ type, value: char });
        return { type, value: char, speak: data.description || `${type} ${char}`, description: data.description };
      }
    }

    return { type: "unknown", speak: "Combinación no reconocida.", dots };
  }

  getText() { return this.sequence.map((s) => s.value).join(""); }
}

export const checkAnswer = (userDots, targetLetter) => {
  const allData = { ...brailleAlphabet, ...brailleNumbers, ...braillePunctuation, ...brailleAccented };
  const target  = allData[targetLetter];
  if (!target) return false;
  if (userDots.length !== target.dots.length) return false;
  return target.dots.every((dot) => userDots.includes(dot));
};

export const getCharData = (char) =>
  INDICATORS[char] || brailleAlphabet[char] || brailleNumbers[char] ||
  braillePunctuation[char] || brailleAccented[char] || null;

export const describeChar = (char) => {
  const data = getCharData(char);
  if (!data) return `Carácter desconocido: ${char}`;
  if (brailleNumbers[char]) {
    return `Número ${char}. Primero el indicador numérico, puntos 3, 4, 5 y 6. Luego: ${data.description}`;
  }
  return data.description;
};

export const textToBraille = (text) =>
  text.toUpperCase().split("").map((char) => {
    const data = getCharData(char);
    return {
      char,
      dots:                  data?.dots        || [],
      description:           data?.description || "Desconocido",
      needsCapitalIndicator: /[A-ZÁÉÍÓÚÜÑ]/.test(char),
      needsNumberIndicator:  /[0-9]/.test(char),
    };
  });