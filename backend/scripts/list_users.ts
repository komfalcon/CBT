import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import { User, UserSchema } from '../src/users/schemas/user.schema';
import * as mongoose from 'mongoose';

dotenv.config();

async function listUsers() {
  await connect(process.env.MONGODB_URI as string);
  const UserModel = mongoose.model<User>('User', UserSchema);
  const users = await UserModel.find({});
  users.forEach(u => console.log(`Email: ${u.email}, CBT: ${u.cbt_key}, Tier: ${u.subscription_tier}, Name: ${u.fullName}`));
  await disconnect();
}
listUsers();
