# Invoxa Deployment Guide - Web, Android & iOS

This comprehensive guide details how to build, containerize, and deploy the **Invoxa SaaS Platform** across:
1. 🌐 **Web Application** (Production Docker, Nginx, Cloud VPS, Azure/AWS)
2. 🤖 **Android Mobile Application** (Google Play Store, Android Studio, APK/AAB)
3. 🍎 **iOS Mobile Application** (Apple App Store, TestFlight, Xcode, IPA)

---

## 🏗️ Architecture & Deployment Flow

```
                           +---------------------------+
                           |  Invoxa PostgreSQL 16 DB  |
                           +-------------+-------------+
                                         |
                                         | :5432
                                         v
                           +---------------------------+
                           |  ASP.NET Core 8 Web API   |
                           |    (Invoxa.API Container) |
                           +-------------+-------------+
                                         |
            +----------------------------+----------------------------+
            |                            |                            |
            v                            v                            v
  +--------------------+       +--------------------+       +--------------------+
  |    Web Browser     |       |    Android App     |       |      iOS App       |
  |  (Nginx Container) |       | (Capacitor Native) |       | (Capacitor Native) |
  |   Port 80 / 443    |       |  Google Play Store |       |  Apple App Store   |
  +--------------------+       +--------------------+       +--------------------+
```

---

## 🌐 1. Web Deployment

### Option A: Complete Docker Compose (Recommended)

The project includes an orchestrator (`docker-compose.yml`) that spins up all 3 tiers with automatic initialization:
- **`invoxa-db`**: PostgreSQL 16 database with persistence and auto-applied schema/seed.
- **`invoxa-api`**: ASP.NET Core 8 API on port `5000`.
- **`invoxa-web`**: React 18 production build served by Nginx on port `80`.

#### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

#### Step 2: Build & Start Stack
```bash
docker compose up -d --build
```

#### Step 3: Verify Deployment
- **Web App**: Open `http://localhost` (or your server domain/IP)
- **API Health Check**: Open `http://localhost:5000/health`
- **Swagger Documentation**: Open `http://localhost:5000/swagger`

---

### Option B: Cloud Hosting (Azure App Service / AWS / VPS)

#### 1. Backend Web API:
Build and deploy the backend Docker container:
```bash
docker build -t your-registry/invoxa-api:latest -f backend/Dockerfile backend/
docker push your-registry/invoxa-api:latest
```
Set environment variables on your cloud provider:
- `ConnectionStrings__DefaultConnection`: Connection string to Azure Database for PostgreSQL or AWS RDS.
- `Jwt__Secret`: Secure 256-bit secret key.
- `Cors__AllowedOrigins__0`: Your production frontend domain (e.g. `https://app.invoxa.com`).

#### 2. Frontend Web App:
- **Using Docker**: Build `frontend/Dockerfile` and deploy behind Cloudflare / reverse proxy.
- **Using Vercel / Netlify**: Connect the `frontend/` directory, set `VITE_API_URL=https://api.yourdomain.com/api`, and set publish directory to `dist`.

---

## 🤖 2. Android Mobile Application Deployment

The frontend uses **Capacitor** to compile the React application into a native Android project for the Google Play Store.

### Prerequisites:
- [Node.js 18+](https://nodejs.org/)
- [Android Studio Iguana / Jellyfish+](https://developer.android.com/studio)
- Java Development Kit (JDK 17)

### Step 1: Install Dependencies & Initialize Android Platform
In the `frontend` folder:
```bash
cd frontend
npm install
npm run build
npx cap add android
```
*(If already added, simply sync: `npm run cap:sync`)*

### Step 2: Configure Android Permissions & Cleartext
Ensure `android/app/src/main/AndroidManifest.xml` includes network and storage permissions (already pre-configured in `frontend/android/app/src/main/AndroidManifest.xml`).

Key permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
```

### Step 3: Run & Test in Android Studio / Emulator
```bash
npm run cap:android
```
This opens the project in Android Studio.
- In Android Studio, select your target device or emulator (e.g., Pixel 8).
- Click **Run** (`Shift + F10`).
- **Connecting to Localhost API from Emulator**: The Android emulator uses `10.0.2.2` to access host machine services. The app includes dynamic server configuration on the Login screen, or you can point `VITE_API_URL` to your production backend.

### Step 4: Generate Production Release Bundle (AAB / APK)
In Android Studio:
1. Navigate to **Build > Generate Signed Bundle / APK**.
2. Select **Android App Bundle** (required for Google Play).
3. Create or select your production `.keystore` signing key.
4. Select `release` build variant and click **Finish**.
5. The generated `.aab` file in `android/app/release/` is ready for upload to **Google Play Console**.

---

## 🍎 3. iOS Mobile Application Deployment

Capacitor compiles the same React codebase into an Xcode project for iPhone and iPad.

### Prerequisites:
- macOS with [Xcode 15+](https://developer.apple.com/xcode/)
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer Account (for device testing & App Store submission)

### Step 1: Install Dependencies & Initialize iOS Platform
In the `frontend` folder:
```bash
cd frontend
npm install
npm run build
npx cap add ios
```
*(If already added, run: `npm run cap:sync`)*

### Step 2: Configure iOS Info.plist & Capabilities
Inspect `ios/App/App/Info.plist` (already pre-configured in `frontend/ios/App/App/Info.plist`):
- `UIFileSharingEnabled`: Set to `true` to allow saving Tax Invoice PDFs directly to the iOS Files app.
- `LSSupportsOpeningDocumentsInPlace`: Set to `true`.
- Status bar and safe-area adjustments are handled automatically by the pre-configured viewport and CSS rules.

### Step 3: Run & Test in Xcode / Simulator
```bash
npm run cap:ios
```
This opens `ios/App/App.xcworkspace` in Xcode:
1. Select your target simulator (e.g. iPhone 15 Pro) or a connected iPhone.
2. Select your development team under **Signing & Capabilities**.
3. Click **Play / Run** (`Cmd + R`).

### Step 4: Archive & Publish to Apple App Store Connect
1. In Xcode, set the active scheme destination to **Any iOS Device (arm64)**.
2. Choose **Product > Archive**.
3. In the Organizer window, select the archive and click **Distribute App**.
4. Choose **App Store Connect** to upload for **TestFlight** beta testing or public **App Store** release.

---

## ⚙️ 4. Mobile & Web Configuration Matrix

| Setting | Web (Local) | Web (Production) | Android Emulator | iOS Simulator / Physical Device |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend URL** | `http://localhost:5173` | `https://app.invoxa.com` | `http://localhost` | `capacitor://localhost` |
| **API Base URL** | `/api` | `/api` (or `https://api.invoxa.com/api`) | `http://10.0.2.2:5000/api` | `https://api.invoxa.com/api` |
| **CORS Origin** | `http://localhost:5173` | `https://app.invoxa.com` | `http://localhost` | `capacitor://localhost` |
| **PDF Handling** | Direct Browser Download | Direct Browser Download | File Save / Web Share Dialog | Share sheet (Files, WhatsApp, AirDrop) |

---

## 🔒 5. Regional & Security Production Checklist

- [x] **CORS Origins**: Configured in `backend/src/Invoxa.API/Program.cs` to allow mobile app schemes (`capacitor://localhost`, `ionic://localhost`, `http://localhost`) and cloud domains.
- [x] **Reverse Proxy Forwarding**: `X-Forwarded-For` and `X-Forwarded-Proto` configured so HTTPS termination doesn't trigger redirect loops.
- [x] **Safe Area Insets**: Viewport configured with `viewport-fit=cover` and CSS safe-area padding (`--sat`, `--sab`) for mobile notch / gesture navigation.
- [x] **Health Check Endpoints**: `/health` and `/api/health` available for AWS ALB, Azure App Service, and Kubernetes probes.
- [x] **Dynamic API Host**: Switch API endpoints on the login screen for testing across staging and production servers.
- [x] **Multi-Tenant Data Isolation**: Automated EF Core query filters prevent cross-tenant data leaks across web and mobile clients.

