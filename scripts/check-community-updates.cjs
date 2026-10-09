// Dependency-free tests for the fork's release channel; no network or credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const sourcePath = path.resolve('src/api/communityUpdates.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = new Module(sourcePath, module);
mod._compile(compiled, sourcePath);
const { selectCommunityUpdate, checkCommunityUpdates, COMMUNITY_VERSION, communityNotes } = mod.exports;
const release = (tag, extra = {}) => ({
  tag_name: tag, draft: false, prerelease: true, body: 'Release notes', published_at: '2026-10-09T00:00:00Z',
  assets: [{ name: 'Athenaeum_0.6.4_zh-CN_x64-setup.exe', state: 'uploaded' }], ...extra,
});
const info = selectCommunityUpdate([
  release('v99.0.0'), release('v0.5.6-zh.99'), release('v0.6.5-beta.1'),
  release('v0.6.4-zh.2'), release('v0.6.4-zh.10'), release('v0.6.4-zh.3'),
  release('v0.6.5-zh.1', { draft: true }), release('v0.7.0-zh.1', { assets: [] }),
  release('v0.8.0-zh.1', { assets: [{ name: 'x_x64-setup.exe', state: 'new' }] }),
]);
assert.equal(info.latestVersion, '0.6.4-zh.10');
assert.equal(info.isUpdateAvailable, true);
assert.equal(info.platformSupported, false);
assert.equal(info.dockerImage, null);
assert.equal(info.downloadPageUrl, 'https://github.com/sedirk/athenaeum/releases/tag/v0.6.4-zh.10');
assert.equal(selectCommunityUpdate([release('v0.6.4-zh.1')]).isUpdateAvailable, false);
assert.equal(selectCommunityUpdate([release('v0.5.6-zh.99')]).latestVersion, COMMUNITY_VERSION);
assert.equal(selectCommunityUpdate([null, {}, release('v0.10.0-zh.1')]).latestVersion, '0.10.0-zh.1');
assert.throws(() => selectCommunityUpdate({ message: 'rate limited' }), /Invalid community release response/);
assert.throws(() => selectCommunityUpdate([], '0.6.4'), /Invalid community build version/);
assert.equal(communityNotes({ version: '0.6.4', notes: 'local', blogUrl: 'https://upstream.invalid' }).blogUrl,
  'https://github.com/sedirk/athenaeum/releases/tag/v' + COMMUNITY_VERSION);
assert.doesNotMatch(fs.readFileSync('src/contexts/UpdatesContext.tsx', 'utf8'), /api\.invoke(?:<[^>]+>)?\(['"](?:install_update|check_for_updates)['"]/);
assert.equal(JSON.parse(fs.readFileSync('crates/athenaeum-tauri/tauri.conf.json', 'utf8')).bundle.createUpdaterArtifacts, false);
(async () => {
  const previous = global.fetch;
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://api.github.com/repos/sedirk/athenaeum/releases?per_page=100');
      assert.ok(options.signal);
      return { ok: true, json: async () => [release('v0.6.5-zh.1')] };
    };
    assert.equal((await checkCommunityUpdates()).latestVersion, '0.6.5-zh.1');
    global.fetch = async () => ({ ok: false, status: 403 });
    await assert.rejects(checkCommunityUpdates, /HTTP 403/);
    global.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(checkCommunityUpdates, /offline/);
  } finally {
    global.fetch = previous;
  }
  console.log('Community update channel: selection, ordering, assets, manual-only guard and error handling passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
