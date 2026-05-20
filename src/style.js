import { getSelf } from './lmnt.js';

let _counter = 0;
let _styleEl = null;
// Keyed by raw CSS string so all instances of the same component share one rule block.
const _cache = new Map(); // cssText -> { id, scoped, count }

function _rebuild() {
  let css = '';
  for (const { scoped } of _cache.values()) css += scoped + '\n';
  _styleEl.textContent = css;
}

// Reads the current component's self from the construction stack (must be called during
// component initialization). Generates a scoped data attribute ID and registers CSS rules
// scoped via `&` — e.g. `& .title { color: red }` becomes
// `[data-s="lmnt-0"] .title { color: red }`. The data-s attribute is automatically
// applied to the component's root element. All components share one injected <style> tag.
export function useStyle(cssText) {
  const self = getSelf();

  if (!_styleEl) {
    _styleEl = document.createElement('style');
    _styleEl.setAttribute('data-lmnt', '');
    document.head.appendChild(_styleEl);
  }

  let entry = _cache.get(cssText);
  if (!entry) {
    const id = 'lmnt-' + (_counter++).toString(36);
    const scoped = cssText.replace(/&/g, `[data-s="${id}"]`);
    entry = { id, scoped, count: 0 };
    _cache.set(cssText, entry);
    _rebuild();
  }
  entry.count++;

  const { id } = entry;
  const captured = entry;

  // Apply after self.el is ready. Also on update in case the root element type changes.
  const applyAttr = () => {
    if (self.el.nodeType === 1) self.el.setAttribute('data-s', id);
  };
  (self.hooks.onCreate ??= []).push(applyAttr);
  (self.hooks.onUpdate ??= []).push(applyAttr);

  (self.hooks.onUnmount ??= []).push(() => {
    captured.count--;
    if (captured.count === 0) {
      _cache.delete(cssText);
      _rebuild();
    }
  });
}
