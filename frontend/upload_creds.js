/**
 * Upload iOS credentials to EAS servers via GraphQL API
 * Then trigger EAS build with remote credentials
 */
const https = require('https');
const fs = require('fs');

const EXPO_TOKEN = 'bSAaETVb2wyb8CdjB0KYCDDUjvk3yfEeEalSuAZh';
const ACCOUNT_ID = '2ee7a6b7-507b-49d1-9f3d-ffaa84ea3cbd';
const APP_ID = '6095040a-fe78-4b71-ae8f-bd1d82f93ef3';

function gql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const options = {
      hostname: 'api.expo.dev',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EXPO_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.errors) {
            console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
          }
          resolve(json);
        } catch (e) {
          console.error('Parse error:', data.substring(0, 500));
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== Uploading iOS Credentials to EAS ===\n');
  
  // Read the p12 and mobileprovision
  const p12Base64 = fs.readFileSync('/app/frontend/ios/certs/dist.p12').toString('base64');
  const profileBase64 = fs.readFileSync('/app/frontend/ios/certs/profile.mobileprovision').toString('base64');
  
  // Step 1: Create distribution certificate on EAS
  console.log('Step 1: Uploading distribution certificate...');
  const certResult = await gql(`
    mutation CreateIosDistCert($input: CreateIosDistributionCertificateInput!) {
      iosDistributionCertificate {
        createIosDistributionCertificate(iosDistributionCertificateInput: $input) {
          id
          certificateP12
          serialNumber
          validityNotAfter
        }
      }
    }
  `, {
    input: {
      certP12: p12Base64,
      certPassword: 'chutex2024',
      appleTeamIdentifier: '94YZY663N2',
      appleTeamName: 'Chutex Innovation',
      accountId: ACCOUNT_ID,
    }
  });
  
  const certId = certResult?.data?.iosDistributionCertificate?.createIosDistributionCertificate?.id;
  console.log('Certificate ID:', certId || 'FAILED');
  if (!certId) {
    console.log('Full response:', JSON.stringify(certResult, null, 2));
    return;
  }
  
  // Step 2: Create provisioning profile linked to cert
  console.log('\nStep 2: Uploading provisioning profile...');
  const profileResult = await gql(`
    mutation CreateIosProvProfile($input: CreateIosProvisioningProfileInput!) {
      iosProvisioningProfile {
        createIosProvisioningProfile(iosProvisioningProfileInput: $input) {
          id
          status
          appleTeamIdentifier
        }
      }
    }
  `, {
    input: {
      provisioningProfile: profileBase64,
      appleAppIdentifierId: 'com.chutex.app',
      appleTeamIdentifier: '94YZY663N2',
      iosDistributionCertificateId: certId,
      appId: APP_ID,
    }
  });
  
  const profileId = profileResult?.data?.iosProvisioningProfile?.createIosProvisioningProfile?.id;
  console.log('Profile ID:', profileId || 'FAILED');
  if (!profileId) {
    console.log('Full response:', JSON.stringify(profileResult, null, 2));
  }
  
  console.log('\n=== Done! Now run: eas build --platform ios --profile production --non-interactive --no-wait ===');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
