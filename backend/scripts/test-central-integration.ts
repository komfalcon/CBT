import * as dotenv from 'dotenv';
dotenv.config();
import { ConfigService } from '@nestjs/config';
import { CentralService } from '../src/central/central.service';
import axios from 'axios';

async function testCbtCentralIntegration() {
  console.log('================================================================');
  console.log('🧪 TESTING CBT <-> AURIKREX-CENTRAL LIVE INTEGRATION');
  console.log('================================================================\n');

  const configService = new ConfigService();
  const centralService = new CentralService(configService);
  const centralUrl = 'https://aurikrex-central.pxxl.click';

  // Test 1: JWKS Key Fetching
  console.log('1️⃣  Testing Live JWKS Public Key Retrieval...');
  try {
    const publicKey = await centralService.getPublicKey();
    console.log('   ✅ SUCCESS! Public key retrieved from https://aurikrex-central.pxxl.click/.well-known/jwks.json');
    console.log('   🔑 Key snippet:', publicKey.substring(0, 50).replace(/\n/g, '') + '...\n');
  } catch (err: any) {
    console.error('   ❌ FAILED JWKS Fetch:', err?.message || err);
  }

  // Test 2: Create Test User in Central Identity DB
  console.log('2️⃣  Creating Test User in Central Identity Database...');
  const testEmail = `cbt_student_${Date.now()}@aurikrex.com`;
  let createdUserId = '';
  try {
    const signupRes = await axios.post(`${centralUrl}/api/v1/auth/signup`, {
      email: testEmail,
      password: 'TestPassword123!',
      fullName: 'CBT Test Student',
      role: 'student',
    });
    createdUserId = signupRes.data?.user?.id || signupRes.data?.id;
    console.log('   ✅ SUCCESS! Created Central User & Wallet.');
    console.log('   👤 User ID:', createdUserId);
    console.log('   🆔 Aurikrex ID:', signupRes.data?.user?.aurikrex_id || signupRes.data?.aurikrex_id, '\n');
  } catch (err: any) {
    console.error('   ❌ FAILED User Signup:', err?.response?.data || err?.message || err);
  }

  if (createdUserId) {
    // Test 3: Server-to-Server AuriCoin Deduction
    console.log('3️⃣  Testing Server-to-Server AuriCoin Deduction...');
    const idempotencyKey = `test_cbt_deduct_${Date.now()}`;
    try {
      const deductRes = await centralService.deductCoins({
        userId: createdUserId,
        featureName: 'ai_tutor_chat',
        idempotencyKey,
      });
      console.log('   ✅ SUCCESS! Coins deducted on Central Turso Cloud Engine.');
      console.log('   📊 Result:', JSON.stringify(deductRes, null, 2), '\n');

      // Test 4: Server-to-Server AuriCoin Refund
      console.log('4️⃣  Testing Server-to-Server AuriCoin Refund...');
      const refundRes = await centralService.refundCoins({
        idempotencyKey,
        reason: 'Automated test suite refund validation',
      });
      console.log('   ✅ SUCCESS! Refund processed on Central Turso Cloud Engine.');
      console.log('   📊 Result:', JSON.stringify(refundRes, null, 2), '\n');
    } catch (err: any) {
      console.error('   ❌ FAILED Coin Deduction/Refund:', err?.response?.data || err?.message || err);
    }
  }

  // Test 5: Shared Knowledge Base Search (Mistral Vectors)
  console.log('5️⃣  Testing Ecosystem Shared Knowledge Base Vector Search...');
  try {
    const searchRes = await centralService.searchKnowledge('jamb physics momentum velocity', 'Physics', 3);
    console.log('   ✅ SUCCESS! Shared Knowledge Base search executed.');
    console.log('   📚 Search results count:', searchRes?.length || 0, '\n');
  } catch (err: any) {
    console.error('   ❌ FAILED Knowledge Search:', err?.response?.data || err?.message || err);
  }

  console.log('================================================================');
  console.log('🎉 CBT <-> AURIKREX-CENTRAL LIVE INTEGRATION TEST COMPLETE!');
  console.log('================================================================');
}

testCbtCentralIntegration().catch((err) => {
  console.error('Integration test runner error:', err);
  process.exit(1);
});
