// "Amlodipine Gx" → "Gx", "Amlodipine" → "Original"
export function getProductType(packMoleculeString: string): string {
  return /\bGx\b/i.test(packMoleculeString) ? 'Gx' : 'Original'
}

// "Amlodipine Gx" → "Amlodipine", "Amlodipine" → "Amlodipine"
export function getIngredientMarket(packMoleculeString: string): string {
  return packMoleculeString.replace(/\s*\bGx\b\s*/gi, '').trim()
}
