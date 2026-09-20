const { sequelize, User } = require('../models');

const promoteAdmin = async () => {
  const email = process.argv[2]?.trim();
  if (!email || process.argv.length !== 3) throw new Error('Usage: npm run admin:promote -- user@example.com');
  const user = await User.findOne({ where: { email } });
  if (!user?.googleID) throw new Error('The user must sign in with Google before being promoted.');
  await user.update({ role: 'admin' });
  console.log(`Administrator access granted to ${user.email}.`);
};

promoteAdmin()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());