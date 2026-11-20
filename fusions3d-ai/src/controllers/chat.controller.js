const { chatRequestSchema } = require('../schemas/chat.schema');
const { generateChatReply } = require('../services/chat.service');

async function chat(req, res, next) {
  try {
    const input = chatRequestSchema.parse(req.body);
    const data = await generateChatReply(input);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { chat };
