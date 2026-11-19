import ts from 'typescript';

// WebWallGL 3.0.2 ships a universal renderer. The extension only needs its local
// PKG path. Remove the other execution paths before the bundler tree-shakes it.
const localSceneBodies = new Map([
  ['checkSceneScript', '{ return { ok: false, message: "SceneScript is disabled", line: null, entries: [], noEntry: true }; }'],
  ['compileSandboxBody', '{ throw new Error("SceneScript is disabled"); }'],
  ['evalTextScript', '{ return null; }'],
  ['evalObjectScript', '{ return null; }'],
  ['httpSource', '{ throw new Error("Only local Scene files are supported"); }'],
  ['installLocalAssets', '{ return null; }'],
  ['startLiveSystem', '{ throw new Error("Desktop media access is disabled"); }'],
  ['mountWallpaper', `{
    rt.cfg = cfg;
    if (cfg.type === "scene" && cfg.source) mountScene(rt, cfg);
    else rt.onUnhandledType?.(cfg);
  }`],
  ['resolveMountConfig', `{
    return {
      type: "scene",
      fit: normalizeFit(o.fit),
      renderDpr: o.renderDpr ?? 0,
      videoTexScale: o.videoTexScale ?? 0,
      sceneFps: o.fps ?? 60,
      muted: true,
      loop: true,
      canvas: ensureSceneCanvas(el),
      source: o.source,
      quality: o.quality,
      autoQuality: o.autoQuality,
      scripts: false
    };
  }`],
]);

export function localSceneRenderer() {
  return {
    name: 'local-scene-renderer',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!/[/\\]webwallgl[/\\]webwallgl\.mjs$/.test(id)) return;

      const source = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
      const remaining = new Map(localSceneBodies);
      const edits = source.statements.flatMap((statement) => {
        if (!ts.isFunctionDeclaration(statement) || !statement.name || !statement.body) return [];
        const name = statement.name.text;
        const replacement = remaining.get(name);
        if (!replacement) return [];
        remaining.delete(name);
        return [{ start: statement.body.getStart(source), end: statement.body.end, replacement }];
      });
      if (remaining.size) {
        throw new Error(`Review the WebWallGL local Scene build: missing ${[...remaining.keys()].join(', ')}`);
      }

      const patched = edits.reverse().reduce(
        (result, { start, end, replacement }) => result.slice(0, start) + replacement + result.slice(end),
        code,
      );
      if (/\b(?:Function|eval)\s*\(/.test(patched)) {
        throw new Error('WebWallGL contains a new dynamic JavaScript execution path');
      }
      return { code: patched, map: null };
    },
  };
}
