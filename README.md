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
  - Background removal (basic implementation, off by default)
- **Live Preview**: Real-time preview of coin designs as you edit
- **SVG Export**: Generate high-quality SVG files suitable for laser engraving
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Get up and running in 5 minutes
- [Technology](docs/TECHNOLOGY.md) - Technology stack and project structure
- [API Documentation](docs/API_DOCUMENTATION.md) - Module reference and extension points
- [Changelog](CHANGELOG.md) - Notable changes by release

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd svg-coin-designer
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

From there, the [Quick Start Guide](docs/QUICK_START.md) walks through designing a coin,
picking image sources, and what the app does to each upload before it reaches the preview.

### Building for Production

```bash
npm run build
```

The build produces a single self-contained `dist/index.html` with all JavaScript and CSS
inlined, so it can be opened directly in a browser without a server. `npm run preview`
serves it at `http://localhost:4173` if you would rather test over HTTP.

### Type Checking

```bash
npm run typecheck
```

Runs the TypeScript compiler without emitting output. `npm run build` performs the same
check before bundling, so this is just the faster feedback loop while editing.

### Testing

```bash
npm run test              # run the suite once
npm run test:watch        # re-run on change
npm run test:file -- src/svgGenerator.test.ts   # a single file
npm run test -- -t "upper-cases"                # a single test by name
```

Tests use [Vitest](https://vitest.dev/) and live beside the code they cover, as
`src/*.test.ts`.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Licensed under the [MIT License](LICENSE).

## Contact

For questions or support, please open an issue on GitHub.

## Copyright

Copyright (c) 2026 Richard McQuiston. Released under the [MIT License](LICENSE).

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)
