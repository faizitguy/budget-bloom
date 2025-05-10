const express = require('express');
const router = express.Router();
const savingsGoalController = require('../controllers/savingsGoalController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create or update a monthly savings goal
 *     tags: [Savings Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetAmount
 *               - year
 *               - month
 *             properties:
 *               targetAmount:
 *                 type: number
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *     responses:
 *       201:
 *         description: Savings goal created successfully
 *       200:
 *         description: Savings goal updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, savingsGoalController.createOrUpdateSavingsGoal);

/**
 * @swagger
 * /api/goals/current:
 *   get:
 *     summary: Get current month's savings goal
 *     tags: [Savings Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current month's savings goal
 *       404:
 *         description: No savings goal set for the current month
 *       401:
 *         description: Unauthorized
 */
router.get('/current', auth, savingsGoalController.getCurrentMonthSavingsGoal);

/**
 * @swagger
 * /api/goals/{year}/{month}:
 *   get:
 *     summary: Get savings goal for a specific month
 *     tags: [Savings Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Savings goal for the specified month
 *       404:
 *         description: No savings goal set for the specified month
 *       401:
 *         description: Unauthorized
 */
router.get('/:year/:month', auth, savingsGoalController.getSavingsGoalForMonth);

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Get all savings goals
 *     tags: [Savings Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of savings goals
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, savingsGoalController.getAllSavingsGoals);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Delete a savings goal
 *     tags: [Savings Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Savings goal deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Savings goal not found
 */
router.delete('/:id', auth, savingsGoalController.deleteSavingsGoal);

/**
 * @swagger
 * /api/goals/progress:
 *   get:
 *     summary: Get savings progress overview
 *     tags: [Savings Goals]
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
 *         description: Savings progress overview
 *       401:
 *         description: Unauthorized
 */
router.get('/progress', auth, savingsGoalController.getSavingsProgressOverview);

/**
 * @swagger
 * /api/goals/nudges:
 *   get:
 *     summary: Get goal encouragement nudges
 *     tags: [Savings Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of encouragement nudges
 *       404:
 *         description: No savings goal set for the current month
 *       401:
 *         description: Unauthorized
 */
router.get('/nudges', auth, savingsGoalController.getGoalEncouragementNudges);

module.exports = router;