---
description: How to build and deploy to TestFlight locally (without EAS credits)
---

Since you are on a Mac, you can build the IPA file locally using your own hardware instead of Expo's cloud builders.

## Prerequisites
1. **Xcode**: You must have Xcode installed from the Mac App Store.
2. **EAS CLI**: Ensure you are logged in (`eas login`).

## Steps

1. **Run Local Build**
   Run the following command to start a local build for iOS:
   ```bash
   eas build --platform ios --local
   ```
   *Note: This will use your local Xcode to compile the app. It might take 10-20 minutes depending on your mac's speed.*

2. **Wait for Compilation**
   - The CLI might ask you to log in to your Apple account to handle certificates and provisioning profiles automatically.
   - Wait until the command finishes and outputs the path to the `.ipa` file.

3. **Upload to TestFlight**
   You have two options to upload the generated `.ipa` file:

   **Option A: Using EAS Submit (Recommended)**
   ```bash
   eas submit --platform ios --path /path/to/your/app.ipa
   ```

   **Option B: Using Transporter App**
   1. Download "Transporter" from the Mac App Store.
   2. Open Transporter and sign in with your Apple ID.
   3. Drag and drop the `.ipa` file into Transporter.
   4. Click "Deliver".

## Troubleshooting
- If the build fails locally, ensure your Xcode is up to date.
- Try running `npx expo doctor` to check for any environment issues.
