import { connect, model, Schema } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const UserSchema = new Schema({}, { strict: false });
const User = model('User', UserSchema);

async function run() {
  await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cbt');
  
  const users = await User.find({});
  for (const user of users) {
    const currentRole = user.get('role');
    if (currentRole && currentRole.toUpperCase() === currentRole) {
      console.log('Fixing role for', user.get('email'), 'from', currentRole, 'to', currentRole.toLowerCase());
      await User.updateOne({ _id: user._id }, { $set: { role: currentRole.toLowerCase() } });
    }
  }
  console.log('Done fixing roles.');
  process.exit(0);
}
run().catch(console.error);
