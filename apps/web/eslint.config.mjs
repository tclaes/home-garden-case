import nx from '@nx/eslint-plugin';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nextCoreWebVitals,
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  {
    ignores: ['.next/**/*', '**/out-tsc'],
  },
];
