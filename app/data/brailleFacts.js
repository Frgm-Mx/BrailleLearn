// ============================================================
// BRAILLE FACTS — Datos curiosos y consejos del sistema Braille
// Usados en las pantallas de carga
// ============================================================

export const brailleFacts = [
  {
    id: 1,
    type: "history",
    emoji: "👦",
    fact: "Louis Braille inventó el sistema a los 15 años, en 1824.",
    detail: "Quedó ciego a los 3 años por un accidente y dedicó su vida a crear una forma de leer para personas ciegas.",
    color: "#0D7E8E",
  },
  {
    id: 2,
    type: "math",
    emoji: "🔢",
    fact: "Con solo 6 puntos se pueden formar 64 combinaciones únicas.",
    detail: "2⁶ = 64. Suficiente para representar todo el alfabeto, números, puntuación y más.",
    color: "#5B2D8E",
  },
  {
    id: 3,
    type: "tip",
    emoji: "💡",
    fact: "Los números en Braille usan el mismo patrón que las letras A–J.",
    detail: "Un indicador especial (puntos 3,4,5,6) antes del patrón le indica al lector que es un número.",
    color: "#F5A623",
  },
  {
    id: 4,
    type: "history",
    emoji: "🎖️",
    fact: "El sistema Braille se basa en un código militar para leer en la oscuridad.",
    detail: "Charles Barbier creó el 'night writing' para que soldados leyeran mensajes sin luz. Louis Braille lo simplificó.",
    color: "#0A7C5E",
  },
  {
    id: 5,
    type: "world",
    emoji: "🌍",
    fact: "El Braille se usa en más de 133 idiomas alrededor del mundo.",
    detail: "Cada idioma adapta las combinaciones de puntos a su propio alfabeto y reglas gramaticales.",
    color: "#1B3A6B",
  },
  {
    id: 6,
    type: "tip",
    emoji: "✋",
    fact: "Los lectores de Braille expertos pueden leer hasta 400 palabras por minuto.",
    detail: "Los dedos índice de ambas manos se mueven de izquierda a derecha en líneas alternadas.",
    color: "#0D7E8E",
  },
  {
    id: 7,
    type: "curiosity",
    emoji: "📐",
    fact: "La distancia estándar entre puntos Braille es de 2.5 mm.",
    detail: "Esta medida está definida por la norma ISO 17049 y garantiza que el dedo humano pueda distinguirlos.",
    color: "#5B2D8E",
  },
  {
    id: 8,
    type: "tip",
    emoji: "🧠",
    fact: "Aprender Braille activa áreas visuales del cerebro en personas ciegas.",
    detail: "Estudios de neuroimagen muestran que el córtex visual se adapta para procesar información táctil.",
    color: "#F5A623",
  },
  {
    id: 9,
    type: "history",
    emoji: "📚",
    fact: "El primer libro en Braille fue publicado en 1829 por Louis Braille.",
    detail: "Se llamaba 'Método para escribir palabras, música y canciones llanas por medio de puntos'.",
    color: "#0A7C5E",
  },
  {
    id: 10,
    type: "world",
    emoji: "🏦",
    fact: "Los billetes de muchos países tienen marcas Braille para identificar su valor.",
    detail: "México, la Unión Europea, India y Canadá incluyen indicadores táctiles en sus monedas y billetes.",
    color: "#1B3A6B",
  },
  {
    id: 11,
    type: "curiosity",
    emoji: "🎵",
    fact: "Existe un sistema Braille específico para escribir música.",
    detail: "El Braille musical usa las mismas celdas de 6 puntos para representar notas, ritmos y dinámicas.",
    color: "#0D7E8E",
  },
  {
    id: 12,
    type: "tip",
    emoji: "🖐️",
    fact: "Practicar 15 minutos diarios es suficiente para aprender el abecedario Braille en un mes.",
    detail: "La consistencia supera a la intensidad. Sesiones cortas y frecuentes son más efectivas.",
    color: "#5B2D8E",
  },
  {
    id: 13,
    type: "world",
    emoji: "🌐",
    fact: "Unicode incluye todos los caracteres Braille en el rango U+2800 a U+28FF.",
    detail: "Esto permite representar Braille digitalmente en cualquier dispositivo que soporte Unicode.",
    color: "#F5A623",
  },
  {
    id: 14,
    type: "history",
    emoji: "🏛️",
    fact: "Francia tardó 16 años en adoptar oficialmente el sistema Braille.",
    detail: "Fue adoptado en 1854, dos años después de la muerte de Louis Braille, quien murió sin ver su invento reconocido.",
    color: "#0A7C5E",
  },
  {
    id: 15,
    type: "curiosity",
    emoji: "⌨️",
    fact: "Las máquinas de escribir Braille tienen solo 6 teclas principales.",
    detail: "Cada tecla corresponde a un punto. Se presionan simultáneamente para formar un carácter.",
    color: "#1B3A6B",
  },
];

// Tipos de facts para filtrar si se necesita
export const FACT_TYPES = {
  history:   { label: "Historia",   color: "#0A7C5E" },
  math:      { label: "Matemáticas", color: "#5B2D8E" },
  tip:       { label: "Consejo",    color: "#F5A623"  },
  world:     { label: "Mundo",      color: "#1B3A6B"  },
  curiosity: { label: "Curiosidad", color: "#0D7E8E"  },
};

// Devuelve un fact aleatorio (diferente al último mostrado)
export const getRandomFact = (lastId = null) => {
  const pool = lastId
    ? brailleFacts.filter((f) => f.id !== lastId)
    : brailleFacts;
  return pool[Math.floor(Math.random() * pool.length)];
};