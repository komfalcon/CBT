async function testGoogle() {
  try {
    console.log('Sending request...');
    const res = await fetch('https://cbt-vl4x.onrender.com/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'dummy_token_123' })
    });
    const text = await res.text();
    console.log('Status:', res.status, 'Body:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}
testGoogle();
