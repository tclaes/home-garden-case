//@ts-check

const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  typescript: {
    // Type safety is already enforced by the separate `typecheck` target (tsc --build across
    // the TS project references). Next 16's own build-time check requires those referenced
    // projects' dist/*.d.ts to already exist, which this repo doesn't pre-build for `build`.
    ignoreBuildErrors: true,
  },
  // `next dev` would otherwise write AGENTS.md/CLAUDE.md boilerplate into apps/web on every
  // run, clashing with the repo's real root CLAUDE.md.
  agentRules: false,
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
