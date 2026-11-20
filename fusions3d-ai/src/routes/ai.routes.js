const express = require('express');
const { requireInternalKey } = require('../middlewares/internal-auth.middleware');
const { describePrint } = require('../controllers/print-description.controller');
const { chat } = require('../controllers/chat.controller');

const router = express.Router();

router.use(requireInternalKey);
router.post('/prints/describe', describePrint);
router.post('/chat', chat);

module.exports = router;