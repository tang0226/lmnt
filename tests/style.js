import { V, L, mount, unmount, patch, useState, Fragment } from '../src/index.js';
import { useStyle } from '../src/style.js';
import {
  assert,
  assertEqual,
  assertNotEqual,
  assertThrows,
  assertDoesNotThrow,
} from '../assert-js/assert.js';
import { TestSuite } from '../assert-js/test-suite.js';

const styleTest = new TestSuite('useStyle');

// --- Error handling ---

styleTest.addTest('throws when called outside component initialization', () => {
  assertThrows(
    () => useStyle('& { color: red; }'),
    'getSelf() must be called during component initialization',
  );
});

// --- Style injection ---

styleTest.addTest('injects a <style> tag into document.head', () => {
  function MyComp() { useStyle('& { color: green; }'); return V('div'); }
  const l = L(V(MyComp));
  assert(document.head.querySelector('style[data-lmnt]') !== null);
  unmount(l);
});

styleTest.addTest('uses a single <style> tag regardless of how many component types call useStyle', () => {
  function CompA() { useStyle('& { margin: 0; }'); return V('div'); }
  function CompB() { useStyle('& { padding: 0; }'); return V('span'); }
  const la = L(V(CompA));
  const lb = L(V(CompB));
  assertEqual(document.head.querySelectorAll('style[data-lmnt]').length, 1);
  unmount(la);
  unmount(lb);
});

// --- Scoping ---

styleTest.addTest('replaces all & occurrences with [data-s~=<id>] word-match selector', () => {
  function MyComp() {
    useStyle('& { font-size: 14px; } &:hover { opacity: 0.8; }');
    return V('div');
  }
  const l = L(V(MyComp));
  const id = l.el.getAttribute('data-s');
  const content = document.head.querySelector('style[data-lmnt]').textContent;
  assert(content.includes(`[data-s~="${id}"] { font-size: 14px; }`));
  assert(content.includes(`[data-s~="${id}"]:hover { opacity: 0.8; }`));
  unmount(l);
});

// --- Automatic attribute application ---

styleTest.addTest('automatically applies data-s to the component root element', () => {
  function MyComp() { useStyle('& { border: none; }'); return V('button'); }
  const l = L(V(MyComp));
  assert(l.el.hasAttribute('data-s'));
  assert(l.el.getAttribute('data-s').startsWith('lmnt-'));
  unmount(l);
});

styleTest.addTest('data-s value on root element matches the selector in the style tag', () => {
  function MyComp() { useStyle('& { cursor: pointer; }'); return V('div'); }
  const l = L(V(MyComp));
  const id = l.el.getAttribute('data-s');
  const content = document.head.querySelector('style[data-lmnt]').textContent;
  assert(content.includes(`[data-s~="${id}"]`));
  unmount(l);
});

styleTest.addTest('data-s is set before mount (on L, not on mount)', () => {
  function MyComp() { useStyle('& { display: block; }'); return V('div'); }
  const l = L(V(MyComp));
  // No mount() call — attribute must already be present
  assert(l.el.hasAttribute('data-s'));
  unmount(l);
});

// --- Deduplication ---

styleTest.addTest('reuses the same scope ID for identical CSS across different component types', () => {
  const css = '& { display: flex; }';
  function CompA() { useStyle(css); return V('div'); }
  function CompB() { useStyle(css); return V('nav'); }
  const la = L(V(CompA));
  const lb = L(V(CompB));
  assertEqual(la.el.getAttribute('data-s'), lb.el.getAttribute('data-s'));
  unmount(la);
  unmount(lb);
});

styleTest.addTest('rule block appears exactly once in style tag with multiple instances', () => {
  const css = '& { overflow: hidden; }';
  function MyComp() { useStyle(css); return V('div'); }
  const l1 = L(V(MyComp));
  const l2 = L(V(MyComp));
  const l3 = L(V(MyComp));
  const id = l1.el.getAttribute('data-s');
  const content = document.head.querySelector('style[data-lmnt]').textContent;
  const occurrences = content.split(`[data-s~="${id}"]`).length - 1;
  assertEqual(occurrences, 1);
  unmount(l1);
  unmount(l2);
  unmount(l3);
});

// --- Cleanup / ref-counting ---

styleTest.addTest('keeps CSS rules while at least one instance is mounted', () => {
  const css = '& { text-align: center; }';
  function MyComp() { useStyle(css); return V('div'); }
  const l1 = L(V(MyComp));
  const l2 = L(V(MyComp));
  const id = l1.el.getAttribute('data-s');
  const styleEl = document.head.querySelector('style[data-lmnt]');

  unmount(l1);
  assert(styleEl.textContent.includes(`[data-s~="${id}"]`), 'rules should remain with 1 instance');

  unmount(l2);
  assert(!styleEl.textContent.includes(`[data-s~="${id}"]`), 'rules should be removed with 0 instances');
});

styleTest.addTest('re-adds CSS rules when a new instance is created after full cleanup', () => {
  const css = '& { letter-spacing: 0.05em; }';
  function MyComp() { useStyle(css); return V('div'); }

  const l1 = L(V(MyComp));
  const id1 = l1.el.getAttribute('data-s');
  unmount(l1); // ref count → 0, entry purged

  const l2 = L(V(MyComp));
  const id2 = l2.el.getAttribute('data-s');
  const styleEl = document.head.querySelector('style[data-lmnt]');
  assertNotEqual(id1, id2); // new scope ID issued after purge
  assert(styleEl.textContent.includes(`[data-s~="${id2}"]`));
  unmount(l2);
});

// --- onUpdate hook ---

styleTest.addTest('re-applies data-s to new root element when type changes on re-render', () => {
  let sig;
  function MyComp() {
    sig = useState('div');
    useStyle('& { color: purple; }');
    return () => V(sig.get());
  }
  const l = L(V(MyComp));
  mount(l, document.body);
  const id = l.el.getAttribute('data-s');
  assertEqual(l.el.tagName, 'DIV');

  sig.set('section');
  assertEqual(l.el.tagName, 'SECTION');
  assertEqual(l.el.getAttribute('data-s'), id);
  unmount(l);
});

// --- Fragment root ---

styleTest.addTest('does not throw for Fragment-root components', () => {
  function MyComp() {
    useStyle('& { color: orange; }');
    return V(Fragment, null, V('div'), V('span'));
  }
  assertDoesNotThrow(() => {
    const l = L(V(MyComp));
    unmount(l);
  });
});

styleTest.addTest('does not set data-s on Fragment anchor (comment node)', () => {
  function MyComp() {
    useStyle('& { color: orange; }');
    return V(Fragment, null, V('div'));
  }
  const l = L(V(MyComp));
  // l.el is the comment anchor — it has nodeType 8, not 1, so setAttribute is skipped
  assertEqual(l.el.nodeType, Node.COMMENT_NODE);
  unmount(l);
});

// --- Nested component collision ---

styleTest.addTest('both scope IDs are present when outer component root is inner component root', () => {
  function Inner() {
    useStyle('& .header { color: red; }');
    return V('div', V('span', { class: 'header' }, 'hi'));
  }
  function Outer() {
    useStyle('& .wrapper { padding: 8px; }');
    return V(Inner);
  }
  const l = L(V(Outer));
  const ids = l.el.getAttribute('data-s').split(' ');
  const styleEl = document.head.querySelector('style[data-lmnt]');
  // Both scope IDs must be on the shared root element
  assertEqual(ids.length, 2);
  assert(styleEl.textContent.includes(`[data-s~="${ids[0]}"]`));
  assert(styleEl.textContent.includes(`[data-s~="${ids[1]}"]`));
  unmount(l);
});

styleTest.addTest('appending is idempotent — repeated onCreate/onUpdate does not duplicate IDs', () => {
  function MyComp() {
    useStyle('& { color: teal; }');
    return () => V('div');
  }
  const l = L(V(MyComp));
  mount(l, document.body);
  const id = l.el.getAttribute('data-s');
  // Simulate a re-render that leaves the same element in place
  patch(l, l.vnode);
  assertEqual(l.el.getAttribute('data-s'), id);
  unmount(l);
});

// --- Regression: lmnt.js $onCreate consistency fix ---

styleTest.addTest('$onCreate in V() props still fires on elements (regression)', () => {
  let fired = false;
  L(V('div', { $onCreate() { fired = true; } }));
  assert(fired);
});

styleTest.addTest('$onCreate in V() props still fires on components (regression)', () => {
  let fired = false;
  function MyComp() { return V('div'); }
  L(V(MyComp, { $onCreate() { fired = true; } }));
  assert(fired);
});

styleTest.addTest('$onCreate receives the L-object as its argument (regression)', () => {
  let receivedSelf;
  function MyComp() { return V('div'); }
  const l = L(V(MyComp, { $onCreate(self) { receivedSelf = self; } }));
  assertEqual(l, receivedSelf);
});

styleTest.runTests();
