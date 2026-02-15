/**
 * Upload credentials to EAS servers via Expo API, then trigger build
 */
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const EXPO_TOKEN = 'bSAaETVb2wyb8CdjB0KYCDDUjvk3yfEeEalSuAZh';
const PROJECT_ID = '6095040a-fe78-4b71-ae8f-bd1d82f93ef3';

function expoApi(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.expo.dev',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${EXPO_TOKEN}`,
        'Content-Type': 'application/json',
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Read the p12 and mobileprovision files
  const p12 = fs.readFileSync('/app/frontend/ios/certs/dist.p12');
  const provProfile = fs.readFileSync('/app/frontend/ios/certs/profile.mobileprovision');
  
  console.log('P12 size:', p12.length, 'bytes');
  console.log('Profile size:', provProfile.length, 'bytes');
  
  // Upload distribution certificate to EAS
  console.log('\nUploading distribution certificate...');
  const certResult = await expoApi('POST', '/v2/projects/' + PROJECT_ID + '/ios-dist-certs', {
    certP12: p12.toString('base64'),
    certPassword: 'chutex2024',
    teamId: '94YZY663N2',
    teamName: 'Chutex Innovation',
  });
  console.log('Cert upload result:', JSON.stringify(certResult).substring(0, 200));
  
  // Upload provisioning profile
  console.log('\nUploading provisioning profile...');
  const profileResult = await expoApi('POST', '/v2/projects/' + PROJECT_ID + '/ios-prov-profiles', {
    provisioningProfile: provProfile.toString('base64'),
    distributionCertificateId: certResult?.data?.id,
  });
  console.log('Profile upload result:', JSON.stringify(profileResult).substring(0, 200));
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
