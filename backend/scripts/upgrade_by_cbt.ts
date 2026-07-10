import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import { User, UserSchema } from '../src/users/schemas/user.schema';
import * as mongoose from 'mongoose';

dotenv.config();

async function upgrade() {
  await connect(process.env.MONGODB_URI as string);
  const UserModel = mongoose.model<User>('User', UserSchema);
  const user = await UserModel.findOneAndUpdate({ cbt_key: 'CBT-2YBYAV' }, { $set: { subscription_tier: 'max', ai_messages_remaining: 50 } }, { new: true });
  console.log('Upgraded:', user?.email, user?.cbt_key, user?.subscription_tier);
  await disconnect();
}
upgrade();


