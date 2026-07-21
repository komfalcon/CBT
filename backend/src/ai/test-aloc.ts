import axios from 'axios';

const TOKEN = 'aloc_4v1oVQKLcCciYczCaxozjk8fam8DIUleDLPJOk2R';
const BASE_URL = 'https://questions.aloc.com.ng/api/v2/q/5?subject=chemistry'; // Try fetching 5

async function test() {
  try {
    const res = await axios.get(BASE_URL, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'AccessToken': TOKEN
      }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

test();
