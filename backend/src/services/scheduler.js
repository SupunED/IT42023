const cron = require('node-cron');
const { Op } = require('sequelize');
const { Lending, Book, User } = require('../models');
const { sendOverdueReminder } = require('./emailService');

/**
 * Initializes scheduled cron jobs
 */
const initCronJobs = () => {
  // Run every day at 00:00 UTC (or can be triggered on startup)
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [Cron] Running daily check for overdue book lendings...');
    await checkOverdueLendings();
  });

  console.log('✅ Cron scheduler initialized for overdue monitoring.');
};

/**
 * Check and flag overdue lendings
 */
const checkOverdueLendings = async () => {
  try {
    const now = new Date();

    // Find all active lendings where dueDate is in the past
    const overdueList = await Lending.findAll({
      where: {
        status: 'Active',
        dueDate: {
          [Op.lt]: now
        }
      },
      include: [
        { model: Book, as: 'book' },
        { model: User, as: 'user' }
      ]
    });

    console.log(`🔍 [Overdue Check] Found ${overdueList.length} overdue lending records.`);

    for (const lending of overdueList) {
      lending.status = 'Overdue';
      await lending.save();

      if (lending.user && lending.user.email) {
        sendOverdueReminder(
          lending,
          lending.user.email,
          lending.book ? lending.book.title : 'Borrowed Book'
        ).catch(err => console.error('Error sending overdue email:', err));
      }
    }
  } catch (error) {
    console.error('❌ Error executing overdue lending check:', error);
  }
};

module.exports = {
  initCronJobs,
  checkOverdueLendings
};
