import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testApi() {
  const apiKey = process.env.DIGITALOCEAN_INFERENCE_KEY;
  if (!apiKey) {
    console.error('DIGITALOCEAN_INFERENCE_KEY is not defined in the environment.');
    return;
  }

  console.log('Testing DigitalOcean Inference API...');
  console.log('Using key prefix:', apiKey.substring(0, 10) + '...');
  
  try {
    const response = await axios.post(
      'https://inference.do-ai.run/v1/chat/completions',
      {
        model: 'gemma-4-31B-it',
        messages: [
          { role: 'user', content: 'Say hello!' }
        ],
        max_tokens: 50,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    console.log('Success! Response:', response.data.choices[0].message.content);
  } catch (error: any) {
    console.error('API call failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testApi();
