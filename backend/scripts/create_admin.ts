import { connect, model, Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomInt, createHash } from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const UserSchema = new Schema({}, { strict: false });
const User = model('User', UserSchema);

function generateCbtKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomInt(0, chars.length));
  }
  return `CBT-${code}`;
}

async function run() {
  await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cbt');
  
  const email = 'falcon@aurikex.tech';
  const password = 'Korex1025$1025$';
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log('User already exists, updating to admin...');
    await User.updateOne({ email }, { $set: { role: 'admin', isAdmin: true, account_status: 'active' } });
    console.log('Done.');
    process.exit(0);
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  
  const cbtKey = generateCbtKey();
  const cbtKeyHash = createHash('sha256').update(cbtKey).digest('hex');

  const newUser = new User({
    fullName: 'Admin Falcon',
    email,
    passwordHash,
    role: 'admin',
    isAdmin: true,
    account_status: 'active',
    cbt_key: cbtKey, // The auto-fix middleware will encrypt this or re-generate if needed
    cbt_key_hash: cbtKeyHash
  });

  await newUser.save();
  console.log('Successfully created admin user:', email);
  process.exit(0);
}
run();
