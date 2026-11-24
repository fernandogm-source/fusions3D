const slugify = require('slugify');
const Print = require('../models/print.model');

function toSlug(text) {
  return slugify(String(text), { lower: true, strict: true });
}

async function generateUniqueSlug(baseSlug, Model, excludeId) {
  let slug = baseSlug;
  let counter = 1;

  while (await Model.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function generateSlug(text, Model = Print) {
  return generateUniqueSlug(toSlug(text), Model);
}

module.exports = { toSlug, generateSlug, generateUniqueSlug };
