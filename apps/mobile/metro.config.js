const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Repo-root files (e.g. catalog-compatibility.json) are imported by the app.
// Without watchFolders, Metro caches them once and ignores later edits — which
// made discoveryAdoptions look "missing" after only restarting the content server.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// @sentry/browser-utils (pulled in transitively by @sentry/react-native's @sentry/browser,
// itself only relevant to web builds) ships a package.json "exports" map with no wildcard
// entry, so Metro's package-exports-aware resolver can't resolve its own internal relative
// imports (e.g. "./is.js" from its index.js) even though the file exists on disk. Disabling
// unstable_enablePackageExports globally "fixes" that but breaks other packages (e.g.
// @expo/ui) that rely on their exports map to find their real entry point — so this only
// turns exports resolution off for imports whose *importer* lives inside the one broken
// package. See https://github.com/getsentry/sentry-react-native/issues/3152.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const originModulePath = context.originModulePath ?? '';
  const nextContext = originModulePath.includes('@sentry/browser-utils')
    ? { ...context, unstable_enablePackageExports: false }
    : context;
  return (defaultResolveRequest ?? context.resolveRequest)(nextContext, moduleName, platform);
};

module.exports = config;
