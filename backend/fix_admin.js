const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    require('dotenv').config({ path: 'c:/Users/DELL/AURIKREX/CBT/backend/.env' });
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to DB...');
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const users = db.collection('users');

    const email = 'falcon@aurikrex.tech';
    const plainPassword = 'Korex1025$1025$';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const result = await users.updateOne(
      { email: email },
      { 
        $set: { 
          passwordHash: passwordHash,
          role: 'ADMIN',
          is_active: true
        }
      },
      { upsert: true }
    );

    console.log('Update result:', result);
    
    // Also let's check lateefedidi4@gmail.com
    const email2 = 'lateefedidi4@gmail.com';
    const result2 = await users.updateOne(
      { email: email2 },
      { 
        $set: { 
          role: 'ADMIN',
          is_active: true
        }
      }
    );
    console.log('Update result 2:', result2);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
