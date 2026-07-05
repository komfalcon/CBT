import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import { User, UserSchema } from '../src/users/schemas/user.schema';
import * as mongoose from 'mongoose';

dotenv.config();

async function upgradeUser() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await connect(uri);
    console.log('Connected to MongoDB');

    const UserModel = mongoose.model<User>('User', UserSchema);

    const email = 'lateefedidi4@gmail.com';
    const user = await UserModel.findOneAndUpdate(
      { email },
      { 
        $set: { 
          subscription_tier: 'max',
          ai_messages_remaining: 50
        } 
      },
      { new: true }
    );

    if (user) {
      console.log(`Successfully upgraded user ${user.email} (CBT ID: ${user.cbt_id}) to MAX tier.`);
      console.log(`Current Tier: ${user.subscription_tier}`);
    } else {
      console.log(`User with email ${email} not found.`);
    }

  } catch (error) {
    console.error('Error upgrading user:', error);
  } finally {
    await disconnect();
    console.log('Disconnected from MongoDB');
  }
}

upgradeUser();
