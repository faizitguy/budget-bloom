const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/analytics/category-distribution:
 *   get:
 *     summary: Get spending distribution across categories
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Category distribution data
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/category-distribution', auth, analyticsController.getCategoryDistribution);

/**
 * @swagger
 * /api/analytics/spending-trends:
 *   get:
 *     summary: Get spending trends over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Spending trends data
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/spending-trends', auth, analyticsController.getSpendingTrends);

/**
 * @swagger
 * /api/analytics/category-comparison:
 *   get:
 *     summary: Compare spending by category between two time periods
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: compareType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [month-to-month, year-to-year]
 *       - in: query
 *         name: current
 *         required: true
 *         schema:
 *           type: string
 *           description: Current period (YYYY-MM for month, YYYY for year)
 *       - in: query
 *         name: previous
 *         required: true
 *         schema:
 *           type: string
 *           description: Previous period (YYYY-MM for month, YYYY for year)
 *     responses:
 *       200:
 *         description: Category comparison data
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/category-comparison', auth, analyticsController.getCategoryComparison);

/**
 * @swagger
 * /api/analytics/savings-progress:
 *   get:
 *     summary: Get detailed savings progress
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Savings progress data
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/savings-progress', auth, analyticsController.getSavingsProgress);

/**
 * @swagger
 * /api/analytics/insights:
 *   get:
 *     summary: Get financial insights and recommendations
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial insights data
 *       401:
 *         description: Unauthorized
 */
router.get('/insights', auth, analyticsController.getFinancialInsights);

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get comprehensive financial summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial summary data
 *       401:
 *         description: Unauthorized
 */
router.get('/summary', auth, analyticsController.getSpendingSummary);

module.exports = router; 