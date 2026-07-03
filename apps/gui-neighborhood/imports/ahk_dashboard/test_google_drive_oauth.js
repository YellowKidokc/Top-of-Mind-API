// test_google_drive_oauth.js
// Quick test to verify OAuth2 connection to ashraf.kahoush@gmail.com

import { drive, testDriveAccess } from './server/google-drive-oauth.js';

console.log('🧪 Testing Google Drive OAuth2 Connection...\n');

async function runTests() {
  // Test 1: Verify account access
  console.log('📋 Test 1: Verifying account access...');
  const authResult = await testDriveAccess();
  
  if (!authResult.success) {
    console.error('❌ Authentication failed!');
    process.exit(1);
  }
  
  console.log('✅ Authentication successful!\n');
  
  // Test 2: List root folders
  console.log('📋 Test 2: Listing root folders...');
  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and 'root' in parents",
      pageSize: 10,
      fields: 'files(id, name, mimeType)',
    });
    
    const folders = response.data.files;
    if (folders.length === 0) {
      console.log('   No folders found in root');
    } else {
      console.log(`   Found ${folders.length} folders:`);
      folders.forEach(folder => {
        console.log(`   - ${folder.name} (${folder.id})`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to list folders:', error.message);
    process.exit(1);
  }
  
  console.log('\n✅ All tests passed!');
  console.log('🎉 Google Drive is connected to: ashraf.kahoush@gmail.com');
}

runTests().catch(err => {
  console.error('💥 Test failed:', err);
  process.exit(1);
});
