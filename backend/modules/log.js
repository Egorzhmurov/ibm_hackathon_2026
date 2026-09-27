// backend/models/Log.js
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  repository: { type: String, default: 'Unknown Repo' },
  rawError: { type: String, required: true },
  rootCause: { type: String, required: true },
  suggestedFix: { type: String, required: true },
  timeSavedMinutes: { type: Number, default: 30 }, // Метрика для дашборда
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);