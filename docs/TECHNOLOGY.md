# TECHNOLOGY

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
