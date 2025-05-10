const Expense = require('../models/Expense');
const SavingsGoal = require('../models/SavingsGoal');

// Category Distribution Analytics
exports.getCategoryDistribution = async (req, res) => {
  try {
    const { year, month, startDate, endDate } = req.query;
    const matchStage = { userId: req.user._id };

    if (year && month) {
      matchStage.year = parseInt(year);
      matchStage.month = parseInt(month);
    } else if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const result = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          categories: {
            $push: {
              category: '$_id',
              amount: '$amount'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          categories: {
            $map: {
              input: '$categories',
              as: 'cat',
              in: {
                category: '$$cat.category',
                amount: '$$cat.amount',
                percentage: {
                  $cond: {
                    if: { $eq: ['$total', 0] },
                    then: 0,
                    else: {
                      $multiply: [
                        { $divide: ['$$cat.amount', '$total'] },
                        100
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    if (!result.length) {
      return res.status(200).json({
        total: 0,
        categories: []
      });
    }

    res.json(result[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Spending Trends Analytics
exports.getSpendingTrends = async (req, res) => {
  try {
    const { period, startDate, endDate, category } = req.query;
    const matchStage = { userId: req.user._id };

    if (category) {
      matchStage.category = category;
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    matchStage.date = { $gte: start, $lte: end };

    let groupStage;
    let projectStage;

    switch (period) {
      case 'daily':
        groupStage = {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          amount: { $sum: '$amount' }
        };
        projectStage = {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day'
                }
              }
            }
          },
          amount: 1
        };
        break;

      case 'weekly':
        groupStage = {
          _id: {
            year: { $year: '$date' },
            week: { $week: '$date' }
          },
          amount: { $sum: '$amount' }
        };
        projectStage = {
          _id: 0,
          week: { $concat: [{ $toString: '$_id.year' }, '-W', { $toString: '$_id.week' }] },
          startDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $dateFromParts: { year: '$_id.year', week: '$_id.week' } }
            }
          },
          endDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $add: [
                  { $dateFromParts: { year: '$_id.year', week: '$_id.week' } },
                  6 * 24 * 60 * 60 * 1000
                ]
              }
            }
          },
          amount: 1
        };
        break;

      case 'monthly':
        groupStage = {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          amount: { $sum: '$amount' }
        };
        projectStage = {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthName: {
            $arrayElemAt: [
              [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ],
              { $subtract: ['$_id.month', 1] }
            ]
          },
          amount: 1
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid period specified' });
    }

    const trends = await Expense.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $project: projectStage },
      { $sort: { date: 1 } }
    ]);

    res.json({ trends });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Category Comparison Analytics
exports.getCategoryComparison = async (req, res) => {
  try {
    const { compareType, current, previous } = req.query;
    if (!compareType || !current || !previous) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const getPeriodMatch = (period) => {
      if (compareType === 'month-to-month') {
        const [year, month] = period.split('-');
        return { year: parseInt(year), month: parseInt(month) };
      } else {
        return { year: parseInt(period) };
      }
    };

    const currentMatch = getPeriodMatch(current);
    const previousMatch = getPeriodMatch(previous);

    const [currentData, previousData] = await Promise.all([
      Expense.aggregate([
        { $match: { ...currentMatch, userId: req.user._id } },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        { $match: { ...previousMatch, userId: req.user._id } },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const currentCategories = {};
    const previousCategories = {};
    let currentTotal = 0;
    let previousTotal = 0;

    currentData.forEach(item => {
      currentCategories[item._id] = item.amount;
      currentTotal += item.amount;
    });

    previousData.forEach(item => {
      previousCategories[item._id] = item.amount;
      previousTotal += item.amount;
    });

    const changes = {
      total: {
        amount: currentTotal - previousTotal,
        percentage: previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
      },
      categories: {}
    };

    const allCategories = new Set([
      ...Object.keys(currentCategories),
      ...Object.keys(previousCategories)
    ]);

    allCategories.forEach(category => {
      const currentAmount = currentCategories[category] || 0;
      const previousAmount = previousCategories[category] || 0;
      changes.categories[category] = {
        amount: currentAmount - previousAmount,
        percentage: previousAmount ? ((currentAmount - previousAmount) / previousAmount) * 100 : 0
      };
    });

    res.json({
      current: {
        period: current,
        total: currentTotal,
        categories: currentCategories
      },
      previous: {
        period: previous,
        total: previousTotal,
        categories: previousCategories
      },
      changes
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Savings Progress Analytics
exports.getSavingsProgress = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months + 1, 1);

    const [savingsGoals, expenses] = await Promise.all([
      SavingsGoal.find({
        userId: req.user._id,
        year: { $gte: startDate.getFullYear() },
        month: { $gte: startDate.getMonth() + 1 }
      }).sort({ year: 1, month: 1 }),
      Expense.aggregate([
        {
          $match: {
            userId: req.user._id,
            year: { $gte: startDate.getFullYear() },
            month: { $gte: startDate.getMonth() + 1 }
          }
        },
        {
          $group: {
            _id: { year: '$year', month: '$month' },
            totalExpenses: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const monthlyProgress = savingsGoals.map(goal => {
      const monthExpenses = expenses.find(
        e => e._id.year === goal.year && e._id.month === goal.month
      );
      const totalExpenses = monthExpenses ? monthExpenses.totalExpenses : 0;
      const savedAmount = goal.targetAmount - totalExpenses;
      const achievementPercentage = (savedAmount / goal.targetAmount) * 100;

      return {
        year: goal.year,
        month: goal.month,
        monthName: new Date(goal.year, goal.month - 1).toLocaleString('default', { month: 'long' }),
        targetAmount: goal.targetAmount,
        totalExpenses,
        savedAmount,
        achievementPercentage,
        isGoalMet: savedAmount >= 0
      };
    });

    const average = {
      targetAmount: monthlyProgress.reduce((sum, month) => sum + month.targetAmount, 0) / monthlyProgress.length,
      savedAmount: monthlyProgress.reduce((sum, month) => sum + month.savedAmount, 0) / monthlyProgress.length,
      achievementRate: monthlyProgress.reduce((sum, month) => sum + month.achievementPercentage, 0) / monthlyProgress.length
    };

    const bestMonth = monthlyProgress.reduce((best, current) => 
      current.achievementPercentage > best.achievementPercentage ? current : best
    );

    const worstMonth = monthlyProgress.reduce((worst, current) => 
      current.achievementPercentage < worst.achievementPercentage ? current : worst
    );

    res.json({
      average,
      monthlyProgress,
      bestMonth,
      worstMonth
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Financial Insights
exports.getFinancialInsights = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const [currentMonthExpenses, previousMonthExpenses, savingsGoal] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            userId: req.user._id,
            year: currentYear,
            month: currentMonth
          }
        },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: req.user._id,
            year: currentYear,
            month: currentMonth - 1
          }
        },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' }
          }
        }
      ]),
      SavingsGoal.findOne({
        userId: req.user._id,
        year: currentYear,
        month: currentMonth
      })
    ]);

    const insights = [];

    // Category spending comparison
    currentMonthExpenses.forEach(current => {
      const previous = previousMonthExpenses.find(p => p._id === current._id);
      if (previous) {
        const change = ((current.amount - previous.amount) / previous.amount) * 100;
        if (change > 30) {
          insights.push({
            type: 'overspending_warning',
            category: current._id,
            message: `Your ${current._id} spending has increased by ${Math.round(change)}% this month.`,
            severity: 'warning'
          });
        }
      }
    });

    // Savings goal progress
    if (savingsGoal) {
      const totalExpenses = currentMonthExpenses.reduce((sum, cat) => sum + cat.amount, 0);
      const savedAmount = savingsGoal.targetAmount - totalExpenses;
      const achievementPercentage = (savedAmount / savingsGoal.targetAmount) * 100;

      if (achievementPercentage >= 75) {
        insights.push({
          type: 'savings_progress',
          message: `You're ${Math.round(achievementPercentage)}% of the way to your monthly savings goal!`,
          severity: 'positive'
        });
      }
    }

    // Category distribution insight
    const totalSpent = currentMonthExpenses.reduce((sum, cat) => sum + cat.amount, 0);
    currentMonthExpenses.forEach(category => {
      const percentage = (category.amount / totalSpent) * 100;
      if (percentage > 30) {
        insights.push({
          type: 'category_insight',
          message: `${category._id} makes up ${Math.round(percentage)}% of your monthly expenses.`,
          severity: 'info'
        });
      }
    });

    // Savings suggestion
    if (savingsGoal && totalSpent > savingsGoal.targetAmount * 0.8) {
      insights.push({
        type: 'suggestion',
        message: 'Try a no-spend day tomorrow to get closer to your savings goal.',
        severity: 'tip'
      });
    }

    res.json({ insights });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Spending Summary
exports.getSpendingSummary = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [currentMonthData, previousMonthData, savingsGoal, dailySpending] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            userId: req.user._id,
            year: currentYear,
            month: currentMonth
          }
        },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: req.user._id,
            year: previousYear,
            month: previousMonth
          }
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' }
          }
        }
      ]),
      SavingsGoal.findOne({
        userId: req.user._id,
        year: currentYear,
        month: currentMonth
      }),
      Expense.aggregate([
        {
          $match: {
            userId: req.user._id,
            year: currentYear,
            month: currentMonth
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { amount: -1 }
        },
        {
          $limit: 1
        }
      ])
    ]);

    const totalSpent = currentMonthData.reduce((sum, cat) => sum + cat.amount, 0);
    const topCategory = currentMonthData.length
      ? currentMonthData.reduce((top, current) => current.amount > top.amount ? current : top)
      : null;

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const averageDailySpend = daysInMonth > 0 ? totalSpent / daysInMonth : 0;

    const highestSpendDay = dailySpending[0] ? {
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dailySpending[0]._id.day).padStart(2, '0')}`,
      amount: dailySpending[0].amount
    } : null;

    const previousMonthTotal = previousMonthData[0]?.totalSpent || 0;
    const monthlyChange = totalSpent - previousMonthTotal;
    const monthlyChangePercentage = previousMonthTotal ? (monthlyChange / previousMonthTotal) * 100 : 0;

    res.json({
      currentMonth: {
        year: currentYear,
        month: currentMonth,
        totalSpent,
        budgetProgress: savingsGoal ? {
          savingsGoal: savingsGoal.targetAmount,
          remainingToSave: savingsGoal.targetAmount - totalSpent,
          percentageAchieved: ((savingsGoal.targetAmount - totalSpent) / savingsGoal.targetAmount) * 100,
          isOverspending: totalSpent > savingsGoal.targetAmount
        } : null,
        topCategory: topCategory
          ? {
              name: topCategory._id,
              amount: topCategory.amount,
              percentage: totalSpent > 0 ? (topCategory.amount / totalSpent) * 100 : 0
            }
          : null,
        averageDailySpend,
        highestSpendDay
      },
      previousMonth: {
        year: previousYear,
        month: previousMonth,
        totalSpent: previousMonthTotal
      },
      trend: {
        monthlyChange: {
          amount: monthlyChange,
          percentage: monthlyChangePercentage
        },
        direction: monthlyChange > 0 ? 'increased' : 'decreased'
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 