const express = require('express');
const { requireInternalKey } = require('../middlewares/internal-auth.middleware');
const { describePrint } = require('../controllers/print-description.controller');
const { chat } = require('../controllers/chat.controller');
const { sentimentForPrint } = require('../controllers/print-sentiment.controller');
const { summarizeReviews } = require('../controllers/print-review-summary.controller');

const router = express.Router();

router.use(requireInternalKey);
router.post('/prints/describe', describePrint);
router.post('/prints/sentiment', sentimentForPrint);
router.post('/prints/reviews/summary', summarizeReviews);
router.post('/chat', chat);

module.exports = router;