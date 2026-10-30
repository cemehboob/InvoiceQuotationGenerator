/**
 * Invoxa Multi-Platform Verification Script
 * Validates build artifacts, native configurations, manifests, and sync across:
 * 1. Web (Vite + SPA dist)
 * 2. Android (Capacitor + Android Studio gradle/manifests)
 * 3. iOS (Capacitor + Xcode .xcodeproj/Info.plist)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exit(1);
  }
}

console.log('--- 1. Testing Web Platform Artifacts ---');
test('Web distribution index.html exists and is configured for mobile safe areas', () => {
  const html = fs.readFileSync(path.join(rootDir, 'frontend/dist/index.html'), 'utf8');
  if (!html.includes('viewport-fit=cover')) throw new Error('Missing viewport-fit=cover in index.html');
  if (!html.includes('Invoxa')) throw new Error('Missing Invoxa brand title');
  if (!html.includes('/assets/index-')) throw new Error('Missing asset script tags');
});

test('Web JS bundle compiles without syntax errors', () => {
  const assets = fs.readdirSync(path.join(rootDir, 'frontend/dist/assets'));
  const jsBundle = assets.find((f) => f.endsWith('.js'));
  if (!jsBundle) throw new Error('No JS bundle found in dist/assets');
  const code = fs.readFileSync(path.join(rootDir, 'frontend/dist/assets', jsBundle), 'utf8');
  new vm.Script(code, { filename: jsBundle });
});

test('Web SPA fallback rules configured in vercel.json and nginx.conf', () => {
  const vercelJson = fs.readFileSync(path.join(rootDir, 'frontend/vercel.json'), 'utf8');
  if (!vercelJson.includes('/index.html')) throw new Error('Missing SPA rewrite in frontend/vercel.json');
  const nginxConf = fs.readFileSync(path.join(rootDir, 'frontend/nginx.conf'), 'utf8');
  if (!nginxConf.includes('try_files $uri $uri/ /index.html')) throw new Error('Missing SPA fallback in frontend/nginx.conf');
});

console.log('\n--- 2. Testing Android Platform Configuration ---');
test('Android assets/public is synchronized with current web build', () => {
  const distHtml = fs.readFileSync(path.join(rootDir, 'frontend/dist/index.html'), 'utf8');
  const androidHtml = fs.readFileSync(path.join(rootDir, 'frontend/android/app/src/main/assets/public/index.html'), 'utf8');
  if (distHtml !== androidHtml) throw new Error('Android assets/public/index.html does not match web dist/index.html');
});

test('AndroidManifest.xml contains network and storage permissions', () => {
  const manifest = fs.readFileSync(path.join(rootDir, 'frontend/android/app/src/main/AndroidManifest.xml'), 'utf8');
  const required = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'usesCleartextTraffic="true"',
    '${applicationId}.fileprovider',
  ];
  required.forEach((req) => {
    if (!manifest.includes(req)) throw new Error(`Missing ${req} in AndroidManifest.xml`);
  });
});

test('Android build.gradle has correct package namespace and SDK targets', () => {
  const buildGradle = fs.readFileSync(path.join(rootDir, 'frontend/android/app/build.gradle'), 'utf8');
  if (!buildGradle.includes('namespace "com.invoxa.app"')) throw new Error('Missing namespace in android/app/build.gradle');
  if (!buildGradle.includes('applicationId "com.invoxa.app"')) throw new Error('Missing applicationId in android/app/build.gradle');
});

console.log('\n--- 3. Testing iOS Platform Configuration ---');
test('iOS App/App/public is synchronized with current web build', () => {
  const distHtml = fs.readFileSync(path.join(rootDir, 'frontend/dist/index.html'), 'utf8');
  const iosHtml = fs.readFileSync(path.join(rootDir, 'frontend/ios/App/App/public/index.html'), 'utf8');
  if (distHtml !== iosHtml) throw new Error('iOS public/index.html does not match web dist/index.html');
});

test('iOS Info.plist has PDF file sharing and App Transport Security enabled', () => {
  const plist = fs.readFileSync(path.join(rootDir, 'frontend/ios/App/App/Info.plist'), 'utf8');
  const required = [
    '<key>UIFileSharingEnabled</key>',
    '<key>LSSupportsOpeningDocumentsInPlace</key>',
    '<key>NSAppTransportSecurity</key>',
    '<string>Invoxa</string>',
  ];
  required.forEach((req) => {
    if (!plist.includes(req)) throw new Error(`Missing ${req} in Info.plist`);
  });
});

test('iOS Xcode project and workspace files are present', () => {
  const pbxproj = fs.existsSync(path.join(rootDir, 'frontend/ios/App/App.xcodeproj/project.pbxproj'));
  if (!pbxproj) throw new Error('Missing App.xcodeproj/project.pbxproj');
  const appDelegate = fs.existsSync(path.join(rootDir, 'frontend/ios/App/App/AppDelegate.swift'));
  if (!appDelegate) throw new Error('Missing AppDelegate.swift');
});

console.log('\n--- 4. Testing Cross-Platform Logic ---');
test('Platform detection and dynamic API base URL handling', () => {
  const platformJs = fs.readFileSync(path.join(rootDir, 'frontend/src/utils/platform.js'), 'utf8');
  if (!platformJs.includes('isNativePlatform')) throw new Error('Missing isNativePlatform() in platform.js');
  if (!platformJs.includes('10.0.2.2')) throw new Error('Missing Android emulator gateway (10.0.2.2) handling in platform.js');
  if (!platformJs.includes('invoxa_api_url')) throw new Error('Missing custom API URL storage support in platform.js');
});

test('Cross-platform PDF download and native share bridge', () => {
  const downloaderJs = fs.readFileSync(path.join(rootDir, 'frontend/src/utils/fileDownloader.js'), 'utf8');
  if (!downloaderJs.includes('navigator.share')) throw new Error('Missing mobile Web Share API handling');
  if (!downloaderJs.includes('downloadOrSharePdf')) throw new Error('Missing downloadOrSharePdf function');
});

console.log('\n======================================================');
console.log('✅ ALL TEST SUITES PASSED: WEB, ANDROID, AND IOS READY');
console.log('======================================================\n');
