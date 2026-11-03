const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const engineRoot = path.resolve(projectRoot, '../packages/engine');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), engineRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@trade-a-gotchi/engine') {
    return { filePath: path.join(engineRoot, 'src/index.ts'), type: 'sourceFile' };
  }
  if (upstreamResolve) return upstreamResolve(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
