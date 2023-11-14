# re`ai`ct

### Automatically optimize React components with AI

Reaict is a Next.js / Vite / Webpack plugin that automatically analyses your React components and optimizes them for performance during build time. It uses OpenAI's `gpt-3.5-turbo` model to generate the optimized code.

Ideally this can improve your app's render performance. If you want to improve reconcilliation, run `npx million@latest` in your app to install [Million.js](https://million.dev)

## Installation

```bash
npm install reaict-js
```

## Usage

### Next.js

```js
// next.config.js
const { next } = require('reaict');

module.exports = next(
  {
    // your next.js config
  },
  { apiKey: 'YOUR_OPENAI_KEY' },
);
```

### Create React App

```js
const withReaict = require('reaict-js');

module.exports = {
  webpack: {
    plugins: { add: [withReaict.webpack({ auto: true })] },
  },
};
```

### Vite

```js
// vite.config.js
import { defineConfig } from 'vite';
import withReaict from 'reaict-js';

export default defineConfig({
  plugins: [withReaict.vite({ apiKey: 'YOUR_OPENAI_KEY' })],
});
```

### Webpack

```js
const withReaict = require('reaict-js');

module.exports = {
  plugins: [withReaict.webpack({ apiKey: 'YOUR_OPENAI_KEY' })],
};
```

## Notes

so much that can be done:

- prompt optimization
- support class / arrow func components
- pre-eval functions
- github action instead of every run
- cache functions across runs
- component validation (perf profiling + screenshot)
- optimizing on threshold (don't memo everything)
- integration w/ v0?
- user hints (e.g. put a function // optimize!)
- integration w/ million.js
- package analysis and auto refactor
- automatic error handing
