const SavingsGoal = require('../models/SavingsGoal');
const Expense = require('../models/Expense');

// Create/Update Monthly Savings Goal
exports.createOrUpdateSavingsGoal = async (req, res) => {
  try {
    const { targetAmount, year, month } = req.body;
    const existingGoal = await SavingsGoal.findOne({ userId: req.user._id, year, month });
    if (existingGoal) {
      existingGoal.targetAmount = targetAmount;
      await existingGoal.save();
      return res.status(200).send(existingGoal);
    }
    const savingsGoal = new SavingsGoal({ targetAmount, year, month, userId: req.user._id });
    await savingsGoal.save();
    res.status(201).send(savingsGoal);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Get Current Month's Savings Goal
exports.getCurrentMonthSavingsGoal = async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const savingsGoal = await SavingsGoal.findOne({ userId: req.user._id, year, month });
    if (!savingsGoal) {
      return res.status(404).send({ error: 'No savings goal set for the current month' });
    }

    const totalExpenses = await Expense.aggregate([
      { $match: { userId: req.user._id, year, month } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpensesAmount = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
    const remainingAmount = savingsGoal.targetAmount - totalExpensesAmount;
    const percentageAchieved = Math.min(100, Math.max(0, (1 - (totalExpensesAmount / savingsGoal.targetAmount)) * 100));
    const isOverspending = totalExpensesAmount > savingsGoal.targetAmount;

    res.send({
      ...savingsGoal.toObject(),
      totalExpenses: totalExpensesAmount,
      remainingAmount,
      percentageAchieved,
      isOverspending
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get Savings Goal for Specific Month
exports.getSavingsGoalForMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const savingsGoal = await SavingsGoal.findOne({ userId: req.user._id, year, month });
    if (!savingsGoal) {
      return res.status(404).send({ error: 'No savings goal set for the specified month' });
    }

    const totalExpenses = await Expense.aggregate([
      { $match: { userId: req.user._id, year, month } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpensesAmount = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
    const remainingAmount = savingsGoal.targetAmount - totalExpensesAmount;
    const percentageAchieved = Math.min(100, Math.max(0, (1 - (totalExpensesAmount / savingsGoal.targetAmount)) * 100));
    const isOverspending = totalExpensesAmount > savingsGoal.targetAmount;

    res.send({
      ...savingsGoal.toObject(),
      totalExpenses: totalExpensesAmount,
      remainingAmount,
      percentageAchieved,
      isOverspending
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get All Savings Goals
exports.getAllSavingsGoals = async (req, res) => {
  try {
    const { year, sortBy, sortOrder } = req.query;
    const query = { userId: req.user._id };
    if (year) query.year = year;

    const sortOptions = {};
    if (sortBy) sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const savingsGoals = await SavingsGoal.find(query).sort(sortOptions);
    res.send(savingsGoals);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Delete Savings Goal
exports.deleteSavingsGoal = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!savingsGoal) {
      return res.status(404).send({ error: 'Savings goal not found' });
    }
    res.send({ message: 'Savings goal deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get Savings Progress Overview
exports.getSavingsProgressOverview = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const savingsGoals = await SavingsGoal.find({
      userId: req.user._id,
      year: { $gte: year - Math.floor(months / 12) },
      month: { $gte: month - (months % 12) }
    });

    const progressOverview = [];
    for (const goal of savingsGoals) {
      const totalExpenses = await Expense.aggregate([
        { $match: { userId: req.user._id, year: goal.year, month: goal.month } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalExpensesAmount = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
      const percentageAchieved = Math.min(100, Math.max(0, (1 - (totalExpensesAmount / goal.targetAmount)) * 100));
      const isOverspending = totalExpensesAmount > goal.targetAmount;

      progressOverview.push({
        year: goal.year,
        month: goal.month,
        targetAmount: goal.targetAmount,
        totalExpenses: totalExpensesAmount,
        percentageAchieved,
        isOverspending
      });
    }

    res.send(progressOverview);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get Goal Encouragement Nudges
exports.getGoalEncouragementNudges = async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const savingsGoal = await SavingsGoal.findOne({ userId: req.user._id, year, month });
    if (!savingsGoal) {
      return res.status(404).send({ error: 'No savings goal set for the current month' });
    }

    const totalExpenses = await Expense.aggregate([
      { $match: { userId: req.user._id, year, month } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpensesAmount = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
    const percentageAchieved = Math.min(100, Math.max(0, (1 - (totalExpensesAmount / savingsGoal.targetAmount)) * 100));

    let nudges = [];

    if (percentageAchieved >= 50) {
      nudges.push("You're halfway to your savings goal!");
    }

    if (percentageAchieved >= 75) {
      nudges.push("You're almost there! Keep pushing towards your savings goal!");
    }

    if (totalExpensesAmount > savingsGoal.targetAmount) {
      nudges.push("Your entertainment spending has doubled this week!");
    }

    if (totalExpensesAmount < savingsGoal.targetAmount / 2) {
      nudges.push("Try a no-spend day tomorrow?");
    }

    if (percentageAchieved >= 100) {
      nudges.push("Congratulations! You've achieved your savings goal for this month!");
    }

    if (percentageAchieved < 25) {
      nudges.push("You're just starting! Keep going, every little bit counts!");
    }

    res.send({ nudges });
  } catch (error) {
    res.status(500).send(error);
  }
};