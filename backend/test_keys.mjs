import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

async function run() {
  console.log('--- Testing Gemini ---');
  const gKey = process.env.GEMINI_API_KEY_1;
  console.log('Gemini Key 1:', gKey ? gKey.substring(0, 10) + '...' : 'NONE');
  try {
    const r = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + gKey, {
      contents: [{ parts: [{ text: 'hi' }] }]
    });
    console.log('Gemini OK:', r.data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (e) {
    console.log('Gemini Err:', e.response?.status, JSON.stringify(e.response?.data || e.message));
  }

  console.log('--- Testing Cloudflare Workers AI Token 1 ---');
  const cfAccount = process.env.CF_ACCOUNT_ID || 'b2f877a02937ca06f9b1ac585f4c6d61';
  const cfToken1 = process.env.CF_API_TOKEN_1;
  console.log('CF Token 1:', cfToken1 ? cfToken1.substring(0, 10) + '...' : 'NONE');
  try {
    const r = await axios.post('https://api.cloudflare.com/client/v4/accounts/' + cfAccount + '/ai/run/@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: 'hi' }]
    }, {
      headers: { Authorization: 'Bearer ' + cfToken1, 'Content-Type': 'application/json' }
    });
    console.log('CF AI 1 OK:', JSON.stringify(r.data?.result));
  } catch (e) {
    console.log('CF AI 1 Err:', e.response?.status, JSON.stringify(e.response?.data || e.message));
  }

  console.log('--- Testing Cloudflare Workers AI Token 2 ---');
  const cfToken2 = process.env.CF_API_TOKEN_2;
  console.log('CF Token 2:', cfToken2 ? cfToken2.substring(0, 10) + '...' : 'NONE');
  try {
    const r = await axios.post('https://api.cloudflare.com/client/v4/accounts/' + cfAccount + '/ai/run/@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: 'hi' }]
    }, {
      headers: { Authorization: 'Bearer ' + cfToken2, 'Content-Type': 'application/json' }
    });
    console.log('CF AI 2 OK:', JSON.stringify(r.data?.result));
  } catch (e) {
    console.log('CF AI 2 Err:', e.response?.status, JSON.stringify(e.response?.data || e.message));
  }

  console.log('--- Testing Grok ---');
  const grokKey = process.env.GROK_API_KEY_1;
  console.log('Grok Key 1:', grokKey ? grokKey.substring(0, 10) + '...' : 'NONE');
  try {
    const r = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-2-mini',
      messages: [{ role: 'user', content: 'hi' }]
    }, {
      headers: { Authorization: 'Bearer ' + grokKey, 'Content-Type': 'application/json' }
    });
    console.log('Grok OK:', r.data?.choices?.[0]?.message?.content);
  } catch (e) {
    console.log('Grok Err:', e.response?.status, JSON.stringify(e.response?.data || e.message));
  }

  console.log('--- Testing SeekAI ---');
  const seekKey = process.env.SEEKAI_KEY;
  console.log('SeekAI Key:', seekKey ? seekKey.substring(0, 10) + '...' : 'NONE');
  try {
    const r = await axios.post('https://seekai.cc/v1/chat/completions', {
      model: 'deepseek-v4-pro',
      messages: [{ role: 'user', content: 'hi' }]
    }, {
      headers: { Authorization: 'Bearer ' + seekKey, 'Content-Type': 'application/json' }
    });
    console.log('SeekAI OK:', r.data?.choices?.[0]?.message?.content);
  } catch (e) {
    console.log('SeekAI Err:', e.response?.status, JSON.stringify(e.response?.data || e.message));
  }
}
run();
