# Screenshots

Add your app screenshots here for the README and hackathon submission.

## Required Screenshots

1. **swap-screen.png** - Main swap interface with quote
2. **loyalty-screen.png** - Loyalty tier list
3. **history-screen.png** - Transaction history
4. **home-screen.png** - Wallet connection screen
5. **token-selector.png** - Token picker modal

## How to Capture

### Android (via adb)
```bash
adb exec-out screencap -p > swap-screen.png
```

### Android (via scrcpy)
```bash
# Install scrcpy first
scrcpy --no-audio &
# Then use your system screenshot tool
```

### iOS Simulator
- Press Cmd+S in Simulator

### Recommended Size
- 1080 x 2400 pixels (or device native resolution)
- PNG format
- Crop status bar if needed

## Image Optimization

```bash
# Optimize PNG files
optipng -o7 *.png

# Or use ImageOptim (macOS)
open -a ImageOptim .
```
