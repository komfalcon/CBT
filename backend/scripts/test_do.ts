import axios from 'axios';
const API_URL = 'https://inference.do-ai.run/v1/chat/completions';
const API_KEY = process.env.DIGITALOCEAN_INFERENCE_KEY || '';
const model = 'llama-4-maverick';

async function test() {
  try {
    console.log("Using Key:", API_KEY);
    const response = await axios.post(
      API_URL,
      { model, messages: [{ role: 'user', content: 'hi' }] },
      { headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    );
    console.log("Success:", response.data.choices[0].message.content);
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}
test();
