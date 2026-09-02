const path = require('path');

const metroConfig = require('../metro.config');

test('resolves the file-linked EntropyStudio package from the app runtime', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const workspaceRoot = path.resolve(projectRoot, '..');

  expect(metroConfig.watchFolders).toContain(workspaceRoot);
  expect(metroConfig.resolver.disableHierarchicalLookup).toBe(true);
  expect(metroConfig.resolver.nodeModulesPaths).toEqual([
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ]);
});
