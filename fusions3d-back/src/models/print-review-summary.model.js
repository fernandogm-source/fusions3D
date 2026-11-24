const mongoose = require('mongoose');

const printReviewSummarySchema = new mongoose.Schema(
  {
    printId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Print',
      required: true,
      unique: true
    },
    signature: {
      type: String,
      required: true
    },
    summary: { type: String, required: true },
    sampleSize: { type: Number, required: true }
  },
  {
    collection: 'print_review_summaries',
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.model('PrintReviewSummary', printReviewSummarySchema);
