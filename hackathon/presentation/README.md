# Smart Swap Presentation

## View Presentation

Open `index.html` in a web browser to view the presentation.

```bash
# From hackathon/presentation directory
open index.html     # macOS
start index.html    # Windows
xdg-open index.html # Linux
```

## Navigation

- **Arrow keys**: Next/Previous slide
- **Space**: Next slide
- **Esc**: Overview mode
- **S**: Speaker notes
- **F**: Fullscreen
- **?**: Keyboard shortcuts

## Export to PDF

### Option 1: Browser Print

1. Open presentation in Chrome/Edge
2. Add `?print-pdf` to URL: `file:///.../index.html?print-pdf`
3. Ctrl/Cmd + P
4. Save as PDF

### Option 2: Decktape (Best Quality)

```bash
# Install decktape
npm install -g decktape

# Export to PDF
decktape reveal index.html SmartSwap_Pitch.pdf
```

### Option 3: Screenshot

1. Press Esc for overview mode
2. Screenshot each slide
3. Combine in PDF

## Customization

1. Add screenshots to replace placeholder boxes
2. Update QR code for demo video
3. Add your contact information
4. Update GitHub repo link

## Tech Stack

- [Reveal.js](https://revealjs.com/) v5.0.4
- CDN-hosted (no npm install required)
- Custom Solana color theme
