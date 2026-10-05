const { testEndpoint } = require('../scripts/run-tests');
const fs = require('fs').promises;
const path = require('path');

async function run(authToken) {
    // Create a temporary test image
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const imageData = Buffer.from('R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=', 'base64'); // 1x1 GIF
    await fs.writeFile(testImagePath, imageData);

    try {
        // Test single file upload
        console.log('\n🧪 Testing single file upload...');
        const formData = new FormData();
        formData.append('file', new Blob([await fs.readFile(testImagePath)], { type: 'image/jpeg' }), 'test-image.jpg');
        
        const uploadResponse = await testEndpoint('POST', '/api/upload', formData, 'Upload Single File');
        const uploadedUrl = uploadResponse.data.url;

        // Test multiple file upload
        console.log('\n🧪 Testing multiple file upload...');
        const multiFormData = new FormData();
        multiFormData.append('files', new Blob([await fs.readFile(testImagePath)], { type: 'image/jpeg' }), 'test-image1.jpg');
        multiFormData.append('files', new Blob([await fs.readFile(testImagePath)], { type: 'image/jpeg' }), 'test-image2.jpg');
        
        await testEndpoint('POST', '/api/upload/multiple', multiFormData, 'Upload Multiple Files');

        // Test file deletion
        console.log('\n🧪 Testing file deletion...');
        await testEndpoint('DELETE', '/api/upload', {
            url: uploadedUrl
        }, 'Delete Uploaded File');

        console.log('\n✅ Upload tests completed successfully');
    } finally {
        // Clean up test image
        await fs.unlink(testImagePath);
    }
}

module.exports = { run };