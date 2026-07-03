// Test Backend OAuth Endpoints
// Run with: node test_backend_oauth.js

async function testBackendOAuth() {
  console.log('🧪 Testing Emma Backend OAuth Endpoints...\n');
  
  // Test 1: Get Auth URL
  console.log('Test 1: GET /api/google/auth');
  try {
    const authResponse = await fetch('http://localhost:4000/api/google/auth');
    const authData = await authResponse.json();
    
    if (authData.url && authData.url.includes('accounts.google.com')) {
      console.log('✅ Auth URL generated successfully');
      console.log('📋 URL:', authData.url.substring(0, 80) + '...');
    } else {
      console.log('❌ Auth URL invalid');
      console.log('Response:', authData);
    }
  } catch (error) {
    console.log('❌ Auth endpoint failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Check server health
  console.log('Test 2: Server Health Check');
  try {
    const response = await fetch('http://localhost:4000/api/google/auth', {
      method: 'HEAD'
    });
    console.log('✅ Server is responding:', response.status);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📝 Next Steps:');
  console.log('1. Start frontend: npm run dev');
  console.log('2. Open http://localhost:3000');
  console.log('3. Navigate to Emma Learning → Google Drive');
  console.log('4. Click "Sync Now" or "Connect Drive"');
  console.log('5. Authorize with ashraf.kahoosh@gmail.com');
}

testBackendOAuth();
