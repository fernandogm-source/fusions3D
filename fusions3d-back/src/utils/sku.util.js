const PrintVariant = require('../models/printVariant.model');

function normalizeCode(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

function buildSkuBase(printName, materialName, color) {
  const words = String(printName)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeCode);

  const firstWord = words[0] || '';
  const lastWord = words.length > 1 ? words[words.length - 1] : '';
  const printCode = firstWord.slice(0, 3) + lastWord.slice(0, 3);

  const materialCode = normalizeCode(materialName).slice(0, 4);
  const colorCode = normalizeCode(color).slice(0, 3);

  return `${printCode}-${materialCode}-${colorCode}`;
}

async function generateSku(base, Model = PrintVariant) {
  let sku = base;
  let counter = 1;

  while (await Model.exists({ sku })) {
    sku = `${base}-${counter}`;
    counter++;
  }

  return sku;
}

module.exports = { buildSkuBase, generateSku };
