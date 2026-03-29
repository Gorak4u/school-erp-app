const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/messenger/conversations?page=1&pageSize=25', {
      headers: {
        'Cookie': process.env.TEST_COOKIE || ''
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Not JSON response');
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

testAPI();
