const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index on userId, year, and month
savingsGoalSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

module.exports = SavingsGoal; 