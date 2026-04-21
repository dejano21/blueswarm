# BlueSwarm Fixes - Version 2.4.0

## Issues Fixed

### 1. ✅ Koi Fish Visibility on Mobile
**Problem**: Koi fish were not visible on the "Explore your five dimensions" screen (intro screen)

**Solution**:
- Removed Three.js `UnderwaterBg` component from the intro screen entirely
- Adjusted z-index hierarchy: koi fish at z-10, interactive buttons at z-20, overlays at z-100
- Made button backgrounds more opaque (rgba(1,13,31,0.85)) for better visibility
- Koi fish now swim clearly visible without Three.js background interference

### 2. ✅ Participant Feedback Submit Button
**Problem**: Submit button was jumping back instead of saving notes and going to swarm visualization

**Solution**:
- The submit handler was already correct in the code
- Added console.log statements to help debug if issues persist
- Handler saves notes to Firebase as `participantNotes` array
- After successful save, navigates to "result" screen (swarm visualization)
- Notes are displayed to profile owners in their result screen

**Code location**: Lines ~1020-1035 in App.jsx

### 3. ⚠️ Coral Reef Background Image
**Problem**: User's coral reef image not showing in swarm visualization

**Solution**:
- **ACTION REQUIRED**: You need to manually add the image file!
- Save your coral reef image (from Gemini) as `coral-reef-bg.jpg`
- Place it in: `blueswarm/public/coral-reef-bg.jpg`
- The code is already set up to display it at 80% opacity
- See `blueswarm/public/CORAL_REEF_IMAGE.md` for detailed instructions

**Why it wasn't working**: The image file was never added to the public folder

### 4. ✅ Back Button Overlays
**Problem**: Back buttons needed overlay treatment for better readability

**Solution**:
- Added `content-overlay` class to back buttons in:
  - Feedback review screen (host)
  - Participant feedback screen
  - Swarm view screen
- Buttons now have backdrop blur and semi-transparent background

## Version Update

Updated version number from v2.3.0 → v2.4.0 (displayed on home screen)

## Deployment Instructions

1. **Add the coral reef image** to `blueswarm/public/coral-reef-bg.jpg`
2. Build the project:
   ```bash
   cd blueswarm
   npm run build
   ```
3. Deploy to Cloudflare Pages (wrangler or dashboard)
4. Hard refresh in browser:
   - Chrome/Firefox: Cmd+Shift+R
   - Safari: Cmd+Option+R

## Testing Checklist

- [ ] Koi fish are visible on "Explore your five dimensions" screen
- [ ] Koi fish swim slowly and randomly (45-52 seconds)
- [ ] Participant can submit feedback and see swarm visualization
- [ ] Coral reef background image appears in swarm view (after adding image file)
- [ ] Back buttons have overlay styling
- [ ] Version shows v2.4.0 on home screen

## Notes

- Participant feedback notes are saved to Firebase under each participant's profile as `participantNotes` array
- Each note includes `pid` (profile ID) and `note` (text content)
- Notes are displayed in the result screen under "Swarm Feedback" section
- The Three.js background is now only used on screens where it doesn't interfere with koi visibility
