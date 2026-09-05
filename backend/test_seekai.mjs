import axios from 'axios';
import { config } from 'dotenv';
config({ path: 'C:/Users/DELL/AURIKEX/CBT/backend/.env' });

async function testSeekAI() {
  const apiKey = process.env.SEEKAI_KEY;
  if (!apiKey) {
    console.log('No SEEKAI_KEY found.');
    return;
  }
  console.log('Testing SeekAI API...');
  
  try {
    const res = await axios.post('https://seekai.cc/v1/chat/completions', {
      model: 'deepseek-v4-pro',
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 10
    }, {
      headers: { Authorization: Bearer  }
    });
    console.log('Success:', res.data.choices[0].message.content);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data);
  }
}
testSeekAI();
