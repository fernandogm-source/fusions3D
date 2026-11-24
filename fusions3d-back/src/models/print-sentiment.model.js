const mongoose = require('mongoose');

const printSentimentSchema = new mongoose.Schema(
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
    positive: { type: Number, required: true },
    neutral: { type: Number, required: true },
    negative: { type: Number, required: true },
    summary: { type: String, required: true },
    sampleSize: { type: Number, required: true }
  },
  {
    collection: 'print_sentiments',
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.model('PrintSentiment', printSentimentSchema);
