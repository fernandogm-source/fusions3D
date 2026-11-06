const slugify = require('slugify');
const Print = require('../models/print.model');

function toSlug(text) {
  return slugify(String(text), { lower: true, strict: true });
}

async function generateSlug(text, Model = Print) {
  const baseSlug = toSlug(text);
  let slug = baseSlug;
  let counter = 1;

  while (await Model.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

module.exports = { toSlug, generateSlug };
