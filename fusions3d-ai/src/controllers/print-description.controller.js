const { printDescriptionRequestSchema } = require('../schemas/print-description.schema');
const { generatePrintDescription } = require('../services/print-description.service');

async function describePrint(req, res, next) {
  try {
    const input = printDescriptionRequestSchema.parse(req.body);
    const data = await generatePrintDescription(input);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { describePrint };
