# Commemorative Coin Designer

A TypeScript-based web application for designing custom commemorative coins with laser-engravable SVG output.

## Features

- **Dual-Side Design**: Create designs for both obverse (front) and reverse (back) of coins
- **Curved Text**: Add text that curves along the top and bottom edges of the coin
- **Portrait Upload**: Upload and process portrait images for the center of each coin side
- **Image Processing**: Automatic image processing including:
  - Grayscale conversion for laser engraving
  - Circular cropping
  - Contrast and brightness adjustment
  - Background removal (basic implementation)
- **Live Preview**: Real-time preview of coin designs as you edit
- **SVG Export**: Generate high-quality SVG files suitable for laser engraving
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Get up and running in 5 minutes
- [Technology](docs/TECHNOLOGY.md) - Technology stack and project structure
- [API Documentation](docs/API_DOCUMENTATION.md) - Module reference and extension points
- [Roadmap](docs/ROADMAP.md) - Planned features and future enhancements
- [Changelog](CHANGELOG.md) - Notable changes by release

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd coin-designer
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. The build creates a **standalone, self-contained HTML file** (`dist/index.html`) that can be opened directly in any browser without requiring a server.

#### Two Ways to Use the Production Build:

**Option 1: Standalone (No Server Required)**

- Simply open `dist/index.html` in any web browser
- Double-click the file or use File → Open in your browser
- All JavaScript and CSS are inlined in the HTML file
- Perfect for offline use or easy distribution

**Option 2: Preview with Local Server**

```bash
npm run preview
```

This serves the dist folder through a local HTTP server at `http://localhost:4173`.

## Usage

1. **Design Obverse (Front)**:
   - Enter text for the top curve
   - Enter text for the bottom curve
   - Upload a portrait image

2. **Design Reverse (Back)**:
   - Enter text for the top curve (e.g., "MERRY CHRISTMAS")
   - Enter text for the bottom curve (e.g., "2025")
   - Upload a portrait image (e.g., Santa Claus)

3. **Preview**:
   - View live previews of both sides in the preview section

4. **Export**:
   - Click "Export SVG Files" to download both coin side SVGs
   - Files will be named `commemorative-coin-obverse.svg` and `commemorative-coin-reverse.svg`

## Image Processing

The application automatically processes uploaded images:

- **Grayscale Conversion**: Converts to grayscale optimized for laser engraving
- **Circular Crop**: Crops image to fit circular coin format
- **Contrast Enhancement**: Adds +10 contrast by default for better engraving
- **Smart Sizing**: Resizes to 800x800px for optimal quality

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Licensed under the [MIT License](LICENSE).

## Contact

For questions or support, please open an issue on GitHub.

## Buy Me a Coffee

I developed this while I currently looking for work. If this app has helped you or someone you know, please consider donating. I appreciate it.

[![Donate](./donate.svg)](https://square.link/u/BgFxtaZI)

## Copyright

Copyright (c) 2026 Richard McQuiston. Released under the [MIT License](LICENSE).
