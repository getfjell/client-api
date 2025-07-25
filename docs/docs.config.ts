import { DocsConfig } from '@fjell/docs-template';

const config: DocsConfig = {
  projectName: 'Fjell Client API',
  basePath: '/client-api/',
  port: 3002,
  branding: {
    theme: 'client-api',
    tagline: 'HTTP Client Library for Fjell',
    backgroundImage: '/pano.png',
    github: 'https://github.com/getfjell/client-api',
    npm: 'https://www.npmjs.com/package/@fjell/client-api'
  },
  sections: [
    {
      id: 'overview',
      title: 'Foundation',
      subtitle: 'Core concepts & HTTP client capabilities',
      file: '/client-api/README.md'
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      subtitle: 'Complete method documentation',
      file: '/client-api/api-reference.md'
    },
    {
      id: 'examples',
      title: 'Examples',
      subtitle: 'Code examples & usage patterns',
      file: '/client-api/examples-README.md'
    }
  ],
  filesToCopy: [
    {
      source: '../examples/README.md',
      destination: 'public/examples-README.md'
    }
  ],
  plugins: [],
  version: {
    source: 'package.json'
  }
}

export default config
