/**
 * Expo Config Plugin for Lefu Scale SDK
 * Adds PPBluetoothKit, PPCalculateKit, PPBaseKit CocoaPods to the iOS build
 */
const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withLefuScale(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf8');
        
        // Add Lefu pods if not already present
        if (!podfile.includes('PPBluetoothKit')) {
          const targetLine = podfile.indexOf("use_frameworks!");
          if (targetLine !== -1) {
            const insertPos = podfile.indexOf('\n', targetLine) + 1;
            const lefuPods = `
  # Lefu Scale SDK
  pod 'PPBaseKit', '1.2.17'
  pod 'PPBluetoothKit', '1.2.33'
  pod 'PPCalculateKit', '1.2.24'
  pod 'PPBasicCalculateKit', '1.0.5'
`;
            podfile = podfile.slice(0, insertPos) + lefuPods + podfile.slice(insertPos);
            fs.writeFileSync(podfilePath, podfile);
          }
        }
      }
      
      return config;
    },
  ]);
}

module.exports = withLefuScale;
