import { connect, model, Schema } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const UserSchema = new Schema({}, { strict: false });
const User = model('User', UserSchema);

async function run() {
  await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cbt');
  const user = await User.findOneAndUpdate(
    { email: 'moparaji57@gmail.com' },
    { $set: { role: 'admin', isAdmin: true } },
    { new: true }
  );
  
  if (user) {
    console.log('Successfully updated user to admin');
  } else {
    console.log('User not found. Could not update to admin.');
  }
  process.exit(0);
}
run();
