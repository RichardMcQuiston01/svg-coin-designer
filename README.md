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

## Technology Stack

- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **Vanilla JavaScript**: No framework dependencies for runtime

## Project Structure

```
coin-designer/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── CoinEditor.ts   # Main editor component
│   │   ├── CoinPreview.ts  # Live preview component
│   │   ├── ImageUploader.ts # Image upload component
│   │   └── TextInput.ts    # Text input component
│   ├── utils/              # Utility functions
│   │   ├── imageProcessing.ts # Image manipulation
│   │   └── svgGenerator.ts    # SVG generation
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── styles/             # CSS styles
│   │   └── main.css
│   └── main.ts             # Application entry point
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # TailwindCSS configuration
└── postcss.config.js       # PostCSS configuration
```

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

### Future AI Integration

For production use, consider integrating AI-based services for:

- Advanced background removal (e.g., remove.bg API)
- Smart cropping (e.g., Cloudinary AI)
- Portrait enhancement

## Code Style

This project follows the **Google TypeScript Style Guide**:

- CamelCase for variables and functions
- PascalCase for types and interfaces
- Descriptive variable names
- Comprehensive error handling
- JSDoc comments for all functions
- Typed variables throughout

## Future Enhancements

- [ ] Template system for pre-designed coins (Christmas, Birthday, etc.)
- [ ] AI-powered background removal integration
- [ ] Advanced image editing controls
- [ ] Custom font selection
- [ ] Color options for non-laser applications
- [ ] Save/load designs
- [ ] Multiple coin size presets
- [ ] Batch processing

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please follow the existing code style and include tests for new features.

## Contact

For questions or support, please open an issue on GitHub.

## Buy Me a Coffee

I developed this while I currently looking for work. If this app has helped you or someone you know, please consider donating. I appreciate it.

[![Donate](./donate.svg)](https://square.link/u/BgFxtaZI)
