const slugify = require('slugify');
const Print = require('../models/print.model');

async function generateSlug(text, Model = Print) {
  const baseSlug = slugify(text, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await Model.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

module.exports = { generateSlug };
