const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./server/models/User');
  const users = await User.find({});
  
  console.log('\n=== Users in Database ===\n');
  
  if (users.length === 0) {
    console.log('No users found.');
  } else {
    users.forEach((user, i) => {
      console.log(`User ${i + 1}:`);
      console.log('  Email:', user.email);
      console.log('  Password (hashed):', user.password);
      console.log('  PIN (hashed):', user.pin);
      console.log('  Created:', user.createdAt);
      console.log('  Last Login:', user.lastLogin || 'Never');
      console.log('');
    });
  }
  
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

