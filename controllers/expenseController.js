const Expense = require('../models/Expense');

// Create Expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    const expense = new Expense({ amount, category, description, date, userId: req.user._id });
    await expense.save();
    res.status(201).send(expense);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Get All Expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, sortBy, sortOrder, limit = 20, page = 1 } = req.query;
    const query = { userId: req.user._id };
    if (category) query.category = category;
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

    const sortOptions = {};
    if (sortBy) sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const expenses = await Expense.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);
    res.send({ expenses, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get Expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).send({ error: 'Expense not found' });
    }
    res.send(expense);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).send({ error: 'Expense not found' });
    }
    expense.amount = amount;
    expense.category = category;
    expense.description = description;
    expense.date = date;
    await expense.save();
    res.send(expense);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).send({ error: 'Expense not found' });
    }
    res.send({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get Calendar View Expenses
exports.getCalendarViewExpenses = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const calendarData = {};
    expenses.forEach(expense => {
      const day = expense.date.getDate();
      if (!calendarData[day]) {
        calendarData[day] = { total: 0, expenses: [] };
      }
      calendarData[day].total += expense.amount;
      calendarData[day].expenses.push(expense);
    });

    res.send(calendarData);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get Monthly Summary
exports.getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const summary = { total: 0, categories: {} };
    expenses.forEach(expense => {
      summary.total += expense.amount;
      if (!summary.categories[expense.category]) {
        summary.categories[expense.category] = 0;
      }
      summary.categories[expense.category] += expense.amount;
    });

    res.send(summary);
  } catch (error) {
    res.status(500).send(error);
  }
}; 