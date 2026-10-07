const slugify = require('slugify');
const Print = require('../modules/print/print.model');

async function generateSlug(text) {
  const baseSlug = slugify(text, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await Print.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

module.exports = { generateSlug };
