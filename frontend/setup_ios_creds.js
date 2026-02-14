/**
 * Script to set up iOS credentials for EAS Build using App Store Connect API
 * Creates distribution certificate + provisioning profile programmatically
 */
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const KEY_ID = 'Y782NVC834';
const ISSUER_ID = '4c54dcaa-4ea0-4b6a-97b6-dce1c7fac20f';
const TEAM_ID = '94YZY663N2';
const BUNDLE_ID = 'com.chutex.app';
const P8_PATH = '/app/frontend/keys/AuthKey_Y782NVC834.p8';

function generateJWT() {
  const privateKey = fs.readFileSync(P8_PATH, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'ES256',
    kid: KEY_ID,
    typ: 'JWT'
  };
  
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: 'appstoreconnect-v1'
  };

  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const headerEncoded = encode(header);
  const payloadEncoded = encode(payload);
  const signingInput = `${headerEncoded}.${payloadEncoded}`;
  
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey);
  
  // Convert DER signature to raw r,s format for ES256
  const derToRaw = (der) => {
    let offset = 2;
    const rLen = der[offset + 1];
    offset += 2;
    let r = der.subarray(offset, offset + rLen);
    offset += rLen + 2;
    let s = der.subarray(offset);
    
    // Remove leading zeros
    if (r.length > 32) r = r.subarray(r.length - 32);
    if (s.length > 32) s = s.subarray(s.length - 32);
    
    // Pad to 32 bytes
    const rPad = Buffer.alloc(32);
    const sPad = Buffer.alloc(32);
    r.copy(rPad, 32 - r.length);
    s.copy(sPad, 32 - s.length);
    
    return Buffer.concat([rPad, sPad]);
  };
  
  const rawSig = derToRaw(signature);
  const signatureEncoded = rawSig.toString('base64url');
  
  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const token = generateJWT();
    const options = {
      hostname: 'api.appstoreconnect.apple.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            console.error(`API Error ${res.statusCode}:`, JSON.stringify(json.errors || json, null, 2));
            reject(new Error(`API Error ${res.statusCode}`));
          } else {
            resolve(json);
          }
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
  try {
    // Step 1: Generate CSR and private key using openssl
    console.log('Step 1: Generating CSR and private key...');
    execSync('openssl req -new -newkey rsa:2048 -nodes -keyout /tmp/dist.key -out /tmp/dist.csr -subj "/CN=Chutex Distribution/O=Chutex/C=FR"', { stdio: 'pipe' });
    const csrContent = fs.readFileSync('/tmp/dist.csr', 'utf8');
    const csrBase64 = csrContent
      .replace('-----BEGIN CERTIFICATE REQUEST-----', '')
      .replace('-----END CERTIFICATE REQUEST-----', '')
      .replace(/\n/g, '');
    console.log('CSR generated successfully');

    // Step 2: Create distribution certificate via Apple API
    console.log('\nStep 2: Creating distribution certificate...');
    const certResult = await apiCall('POST', '/v1/certificates', {
      data: {
        type: 'certificates',
        attributes: {
          certificateType: 'IOS_DISTRIBUTION',
          csrContent: csrBase64
        }
      }
    });
    
    const certId = certResult.data.id;
    const certContent = certResult.data.attributes.certificateContent;
    console.log(`Certificate created! ID: ${certId}`);
    
    // Save the certificate
    const certDer = Buffer.from(certContent, 'base64');
    fs.writeFileSync('/tmp/dist.cer', certDer);
    
    // Convert to p12
    execSync('openssl x509 -inform DER -in /tmp/dist.cer -out /tmp/dist.pem');
    execSync('openssl pkcs12 -export -out /tmp/dist.p12 -inkey /tmp/dist.key -in /tmp/dist.pem -password pass:chutex2024');
    console.log('P12 file created');

    // Step 3: Find or create Bundle ID
    console.log('\nStep 3: Looking up Bundle ID...');
    const bundleIds = await apiCall('GET', `/v1/bundleIds?filter[identifier]=${BUNDLE_ID}`);
    let bundleIdResourceId;
    
    if (bundleIds.data && bundleIds.data.length > 0) {
      bundleIdResourceId = bundleIds.data[0].id;
      console.log(`Bundle ID found: ${bundleIdResourceId}`);
    } else {
      console.log('Creating Bundle ID...');
      const newBundle = await apiCall('POST', '/v1/bundleIds', {
        data: {
          type: 'bundleIds',
          attributes: {
            identifier: BUNDLE_ID,
            name: 'Chutex App',
            platform: 'IOS'
          }
        }
      });
      bundleIdResourceId = newBundle.data.id;
      console.log(`Bundle ID created: ${bundleIdResourceId}`);
    }

    // Step 4: Create provisioning profile
    console.log('\nStep 4: Creating provisioning profile...');
    const profileResult = await apiCall('POST', '/v1/profiles', {
      data: {
        type: 'profiles',
        attributes: {
          name: 'Chutex App Store Profile',
          profileType: 'IOS_APP_STORE'
        },
        relationships: {
          bundleId: {
            data: {
              type: 'bundleIds',
              id: bundleIdResourceId
            }
          },
          certificates: {
            data: [{
              type: 'certificates',
              id: certId
            }]
          }
        }
      }
    });
    
    const profileContent = profileResult.data.attributes.profileContent;
    fs.writeFileSync('/tmp/profile.mobileprovision', Buffer.from(profileContent, 'base64'));
    console.log('Provisioning profile created!');

    // Step 5: Copy to project
    const certsDir = '/app/frontend/ios/certs';
    execSync(`mkdir -p ${certsDir}`);
    execSync(`cp /tmp/dist.p12 ${certsDir}/dist.p12`);
    execSync(`cp /tmp/profile.mobileprovision ${certsDir}/profile.mobileprovision`);
    
    console.log('\n=== SUCCESS ===');
    console.log(`Distribution certificate: ${certsDir}/dist.p12`);
    console.log(`Provisioning profile: ${certsDir}/profile.mobileprovision`);
    console.log('Password: chutex2024');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
