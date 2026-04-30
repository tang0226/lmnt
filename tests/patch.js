import { V, L, mount, unmount, patch } from '../src/index.js';
import {
  assert,
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertType,
  assertInstance,
  assertDefined,
  assertTruthy,
  assertFalsy,
  assertThrows,
  assertDoesNotThrow
} from '../test-framework/assert.js';
import { TestSuite } from '../test-framework/test-suite.js';

const patchTest = new TestSuite('patch');

// --- Static tag patches ---

patchTest.addTest('returns same self for in-place patch', () => {
  const l = L(V('div', { id: 'test' }));
  const result = patch(l, V('div', { id: 'test' }));
  assertEqual(result, l);
  assertEqual(result.el, l.el);
});

patchTest.addTest('adds a new prop', () => {
  const l = L(V('div'));
  patch(l, V('div', { id: 'new-id' }));
  assertEqual(l.el.id, 'new-id');
});

patchTest.addTest('removes a prop', () => {
  const l = L(V('div', { id: 'old-id' }));
  patch(l, V('div'));
  assertEqual(l.el.id, '');
});

patchTest.addTest('updates a changed prop value', () => {
  const l = L(V('div', { id: 'old' }));
  patch(l, V('div', { id: 'new' }));
  assertEqual(l.el.id, 'new');
});

patchTest.addTest('does not reassign a prop when value is unchanged', () => {
  const l = L(V('div', { id: 'same' }));
  let setCount = 0;
  Object.defineProperty(l.el, 'id', {
    get() { return 'same'; },
    set() { setCount++; },
    configurable: true,
  });
  patch(l, V('div', { id: 'same' }));
  assertEqual(setCount, 0);
});

patchTest.addTest('updates class via className', () => {
  const l = L(V('div', { class: 'old' }));
  patch(l, V('div', { class: 'new' }));
  assertEqual(l.el.className, 'new');
});

patchTest.addTest('updates for via htmlFor', () => {
  const l = L(V('label', { for: 'old-id' }));
  patch(l, V('label', { for: 'new-id' }));
  assertEqual(l.el.htmlFor, 'new-id');
});

patchTest.addTest('adds an event listener', () => {
  let called = false;
  const l = L(V('button'));
  patch(l, V('button', { onClick: () => { called = true; } }));
  l.el.click();
  assert(called);
});

patchTest.addTest('removes an event listener', () => {
  let called = false;
  const l = L(V('button', { onClick: () => { called = true; } }));
  patch(l, V('button'));
  l.el.click();
  assert(!called);
});

patchTest.addTest('swapped event handler fires new handler, not old', () => {
  let calledA = false, calledB = false;
  const l = L(V('button', { onClick: () => { calledA = true; } }));
  patch(l, V('button', { onClick: () => { calledB = true; } }));
  l.el.click();
  assert(!calledA);
  assert(calledB);
});

patchTest.addTest('adds a style object property', () => {
  const l = L(V('div', { style: { color: 'red' } }));
  patch(l, V('div', { style: { color: 'red', fontSize: '16px' } }));
  assertEqual(l.el.style.color, 'red');
  assertEqual(l.el.style.fontSize, '16px');
});

patchTest.addTest('removes a style object property', () => {
  const l = L(V('div', { style: { color: 'red', fontSize: '16px' } }));
  patch(l, V('div', { style: { color: 'red' } }));
  assertEqual(l.el.style.fontSize, '');
});

patchTest.addTest('replaces style object with string', () => {
  const l = L(V('div', { style: { color: 'red' } }));
  patch(l, V('div', { style: 'font-size: 20px' }));
  assertEqual(l.el.style.fontSize, '20px');
  assertEqual(l.el.style.color, '');
});

patchTest.addTest('replaces style string with object', () => {
  const l = L(V('div', { style: 'color: red' }));
  patch(l, V('div', { style: { fontSize: '16px' } }));
  assertEqual(l.el.style.fontSize, '16px');
  assertEqual(l.el.style.color, '');
});

patchTest.addTest('clears style when prop is removed', () => {
  const l = L(V('div', { style: { color: 'red' } }));
  patch(l, V('div'));
  assertEqual(l.el.style.cssText, '');
});

patchTest.addTest('full replace on different tag type: new el in DOM, new self returned', () => {
  const l = L(V('div'));
  mount(l, document.body);
  const result = patch(l, V('span'));
  assertNotEqual(result, l);
  assertEqual(result.el.tagName, 'SPAN');
  assert(document.body.contains(result.el));
  assert(!document.body.contains(l.el));
  unmount(result);
});

// --- Text node patches ---

patchTest.addTest('text → same text: no-op, same node', () => {
  const l = L('hello');
  const originalEl = l.el;
  patch(l, 'hello');
  assertEqual(l.el, originalEl);
});

patchTest.addTest('text → different text: updates nodeValue in place', () => {
  const l = L('hello');
  const originalEl = l.el;
  const result = patch(l, 'world');
  assertEqual(result.el, originalEl);
  assertEqual(l.el.nodeValue, 'world');
});

patchTest.addTest('text → element: DOM node replaced, new self returned', () => {
  const l = L('hello');
  mount(l, document.body);
  const result = patch(l, V('div'));
  assertNotEqual(result, l);
  assertEqual(result.el.tagName, 'DIV');
  assert(document.body.contains(result.el));
  unmount(result);
});

patchTest.addTest('element → text: DOM node replaced, old unmount lifecycle runs', () => {
  let unmounted = false;
  const l = L(V('div', { $onUnmount() { unmounted = true; } }));
  mount(l, document.body);
  const result = patch(l, 'hello');
  assertNotEqual(result, l);
  assertEqual(result.el.nodeValue, 'hello');
  assert(unmounted);
  unmount(result);
});

// --- Children: unkeyed (positional) ---

patchTest.addTest('appends a child', () => {
  const l = L(V('div', V('span')));
  mount(l, document.body);
  patch(l, V('div', V('span'), V('p')));
  assertEqual(l.el.children.length, 2);
  assertEqual(l.el.children[1].tagName, 'P');
  unmount(l);
});

patchTest.addTest('removes last child, runs its unmount lifecycle', () => {
  let unmounted = false;
  const l = L(V('div', V('span', { $onUnmount() { unmounted = true; } })));
  mount(l, document.body);
  patch(l, V('div'));
  assertEqual(l.el.children.length, 0);
  assert(unmounted);
  unmount(l);
});

patchTest.addTest('removes middle child, siblings unaffected', () => {
  const l = L(V('div', V('span', { id: 'a' }), V('span', { id: 'b' }), V('span', { id: 'c' })));
  mount(l, document.body);
  patch(l, V('div', V('span', { id: 'a' }), V('span', { id: 'c' })));
  assertEqual(l.el.children.length, 2);
  assertEqual(l.el.children[0].id, 'a');
  assertEqual(l.el.children[1].id, 'c');
  unmount(l);
});

patchTest.addTest('replaces child on type change, fires unmount and mount', () => {
  let childUnmounted = false, childMounted = false;
  const l = L(V('div', V('span', { $onUnmount() { childUnmounted = true; } })));
  mount(l, document.body);
  patch(l, V('div', V('p', { $onMount() { childMounted = true; } })));
  assertEqual(l.el.children[0].tagName, 'P');
  assert(childUnmounted);
  assert(childMounted);
  unmount(l);
});

patchTest.addTest('patches child in place (same type): same DOM node', () => {
  const l = L(V('div', V('span', { id: 'old' })));
  const childEl = l.children[0].el;
  patch(l, V('div', V('span', { id: 'new' })));
  assertEqual(l.children[0].el, childEl);
  assertEqual(l.el.children[0].id, 'new');
});

patchTest.addTest('empty → many children: all created and mounted', () => {
  let mountCount = 0;
  const l = L(V('div'));
  mount(l, document.body);
  patch(l, V('div',
    V('span', { $onMount() { mountCount++; } }),
    V('p', { $onMount() { mountCount++; } }),
  ));
  assertEqual(l.el.children.length, 2);
  assertEqual(mountCount, 2);
  unmount(l);
});

patchTest.addTest('many → empty children: all unmounted', () => {
  let unmountCount = 0;
  const l = L(V('div',
    V('span', { $onUnmount() { unmountCount++; } }),
    V('p', { $onUnmount() { unmountCount++; } }),
  ));
  mount(l, document.body);
  patch(l, V('div'));
  assertEqual(l.el.children.length, 0);
  assertEqual(unmountCount, 2);
  unmount(l);
});

// --- Children: keyed ---

patchTest.addTest('keyed append: existing nodes patched in place, new node added', () => {
  const l = L(V('div',
    V('span', { key: 'a', id: 'a' }),
    V('span', { key: 'b', id: 'b' }),
  ));
  mount(l, document.body);
  const [elA, elB] = l.children.map(c => c.el);
  patch(l, V('div',
    V('span', { key: 'a', id: 'a' }),
    V('span', { key: 'b', id: 'b' }),
    V('span', { key: 'c', id: 'c' }),
  ));
  assertEqual(l.children[0].el, elA);
  assertEqual(l.children[1].el, elB);
  assertEqual(l.el.children[2].id, 'c');
  unmount(l);
});

patchTest.addTest('keyed prepend: new node at front, existing nodes moved', () => {
  const l = L(V('div',
    V('span', { key: 'a', id: 'a' }),
    V('span', { key: 'b', id: 'b' }),
  ));
  mount(l, document.body);
  const [elA, elB] = l.children.map(c => c.el);
  patch(l, V('div',
    V('span', { key: 'c', id: 'c' }),
    V('span', { key: 'a', id: 'a' }),
    V('span', { key: 'b', id: 'b' }),
  ));
  assertEqual(l.el.children[0].id, 'c');
  assertEqual(l.el.children[1], elA);
  assertEqual(l.el.children[2], elB);
  unmount(l);
});

patchTest.addTest('keyed reverse: DOM reordered, zero creates or destroys', () => {
  const l = L(V('div',
    V('span', { key: 'a', id: 'a' }),
    V('span', { key: 'b', id: 'b' }),
    V('span', { key: 'c', id: 'c' }),
  ));
  mount(l, document.body);
  const [elA, elB, elC] = l.children.map(c => c.el);
  patch(l, V('div',
    V('span', { key: 'c', id: 'c' }),
    V('span', { key: 'b', id: 'b' }),
    V('span', { key: 'a', id: 'a' }),
  ));
  assertEqual(l.el.children[0], elC);
  assertEqual(l.el.children[1], elB);
  assertEqual(l.el.children[2], elA);
  unmount(l);
});

patchTest.addTest('keyed remove: correct node unmounted, others intact', () => {
  let unmounted = false;
  const l = L(V('div',
    V('span', { key: 'a', id: 'a' }),
    V('span', { key: 'b', $onUnmount() { unmounted = true; } }),
    V('span', { key: 'c', id: 'c' }),
  ));
  mount(l, document.body);
  const [elA, , elC] = l.children.map(c => c.el);
  patch(l, V('div',
    V('span', { key: 'a', id: 'a' }),
    V('span', { key: 'c', id: 'c' }),
  ));
  assertEqual(l.el.children.length, 2);
  assertEqual(l.el.children[0], elA);
  assertEqual(l.el.children[1], elC);
  assert(unmounted);
  unmount(l);
});

patchTest.addTest('key absent in new: old node unmounted', () => {
  let unmounted = false;
  const l = L(V('div', V('span', { key: 'gone', $onUnmount() { unmounted = true; } })));
  mount(l, document.body);
  patch(l, V('div'));
  assert(unmounted);
  assertEqual(l.el.children.length, 0);
  unmount(l);
});

patchTest.addTest('key absent in old: new node created and mounted', () => {
  let mounted = false;
  const l = L(V('div'));
  mount(l, document.body);
  patch(l, V('div', V('span', { key: 'new', $onMount() { mounted = true; } })));
  assert(mounted);
  assertEqual(l.el.children.length, 1);
  unmount(l);
});

patchTest.addTest('key match with type change: child replaced', () => {
  let childUnmounted = false, childMounted = false;
  const l = L(V('div', V('div', { key: 'x', $onUnmount() { childUnmounted = true; } })));
  mount(l, document.body);
  patch(l, V('div', V('span', { key: 'x', $onMount() { childMounted = true; } })));
  assertEqual(l.el.children[0].tagName, 'SPAN');
  assert(childUnmounted);
  assert(childMounted);
  unmount(l);
});

patchTest.addTest('keyed reorder: same L-node objects reused (no unnecessary creates)', () => {
  const l = L(V('div',
    V('span', { key: 'a' }),
    V('span', { key: 'b' }),
  ));
  mount(l, document.body);
  const [childA, childB] = l.children;
  patch(l, V('div',
    V('span', { key: 'b' }),
    V('span', { key: 'a' }),
  ));
  assertEqual(l.children[0], childB);
  assertEqual(l.children[1], childA);
  unmount(l);
});

// --- Children: mixed keyed/unkeyed ---

patchTest.addTest('unkeyed positional match, same type: patched in place', () => {
  const l = L(V('div', V('span', { id: 'old' })));
  const oldEl = l.children[0].el;
  patch(l, V('div', V('span', { id: 'new' })));
  assertEqual(l.children[0].el, oldEl);
  assertEqual(l.el.children[0].id, 'new');
});

patchTest.addTest('unkeyed positional match, type mismatch: replaced', () => {
  const l = L(V('div', V('span')));
  const oldEl = l.children[0].el;
  mount(l, document.body);
  patch(l, V('div', V('p')));
  assertNotEqual(l.children[0].el, oldEl);
  assertEqual(l.el.children[0].tagName, 'P');
  unmount(l);
});

patchTest.addTest('more new unkeyed than old: excess created and mounted', () => {
  let mountCount = 0;
  const l = L(V('div', V('span')));
  mount(l, document.body);
  patch(l, V('div',
    V('span'),
    V('p', { $onMount() { mountCount++; } }),
    V('div', { $onMount() { mountCount++; } }),
  ));
  assertEqual(l.el.children.length, 3);
  assertEqual(mountCount, 2);
  unmount(l);
});

patchTest.addTest('more old unkeyed than new: excess unmounted', () => {
  let unmountCount = 0;
  const l = L(V('div',
    V('span'),
    V('p', { $onUnmount() { unmountCount++; } }),
    V('div', { $onUnmount() { unmountCount++; } }),
  ));
  mount(l, document.body);
  patch(l, V('div', V('span')));
  assertEqual(l.el.children.length, 1);
  assertEqual(unmountCount, 2);
  unmount(l);
});

patchTest.addTest('keyed and unkeyed children coexist: matched independently', () => {
  const l = L(V('div',
    V('span', { key: 'k', id: 'keyed' }),
    V('p', { id: 'unkeyed' }),
  ));
  mount(l, document.body);
  const keyedEl = l.children[0].el;
  patch(l, V('div',
    V('p', { id: 'unkeyed-new' }),
    V('span', { key: 'k', id: 'keyed-new' }),
  ));
  assertEqual(l.children[1].el, keyedEl);
  assertEqual(l.el.children[0].id, 'unkeyed-new');
  assertEqual(l.el.children[1].id, 'keyed-new');
  unmount(l);
});

// --- Component patches ---

patchTest.addTest('stateless: re-renders with new props', () => {
  function Greeting({ name }) { return V('div', name); }
  const l = L(V(Greeting, { name: 'Alice' }));
  patch(l, V(Greeting, { name: 'Bob' }));
  assertEqual(l.el.textContent, 'Bob');
});

patchTest.addTest('stateless: re-renders with new children', () => {
  function Wrapper({ children }) { return V('div', children); }
  const l = L(V(Wrapper, {}, 'hello'));
  patch(l, V(Wrapper, {}, 'world'));
  assertEqual(l.el.textContent, 'world');
});

patchTest.addTest('stateless: same output tag — same DOM node', () => {
  function Comp() { return V('div'); }
  const l = L(V(Comp));
  const originalEl = l.childL.el;
  patch(l, V(Comp));
  assertEqual(l.childL.el, originalEl);
});

patchTest.addTest('stateless: different output tag — self.el updated', () => {
  let useSpan = false;
  function Comp() { return useSpan ? V('span') : V('div'); }
  const l = L(V(Comp));
  mount(l, document.body);
  assertEqual(l.el.tagName, 'DIV');
  useSpan = true;
  patch(l, V(Comp));
  assertEqual(l.el.tagName, 'SPAN');
  assert(document.body.contains(l.el));
  unmount(l);
});

patchTest.addTest('different stateless component type: full replace', () => {
  function A() { return V('div', 'A'); }
  function B() { return V('div', 'B'); }
  const l = L(V(A));
  mount(l, document.body);
  const result = patch(l, V(B));
  assertNotEqual(result, l);
  assertEqual(result.el.textContent, 'B');
  unmount(result);
});

patchTest.addTest('component → tag: full replace', () => {
  function Comp() { return V('div', 'comp'); }
  const l = L(V(Comp));
  mount(l, document.body);
  const result = patch(l, V('span', 'tag'));
  assertNotEqual(result, l);
  assertEqual(result.el.tagName, 'SPAN');
  unmount(result);
});

patchTest.addTest('tag → component: full replace', () => {
  function Comp() { return V('div', 'comp'); }
  const l = L(V('span', 'tag'));
  mount(l, document.body);
  const result = patch(l, V(Comp));
  assertNotEqual(result, l);
  assertEqual(result.el.textContent, 'comp');
  unmount(result);
});

patchTest.addTest('stateless component chain: all levels re-render', () => {
  function Inner({ value }) { return V('span', value); }
  function Middle({ value }) { return V(Inner, { value }); }
  function Outer({ value }) { return V(Middle, { value }); }
  const l = L(V(Outer, { value: 'hello' }));
  assertEqual(l.el.textContent, 'hello');
  patch(l, V(Outer, { value: 'world' }));
  assertEqual(l.el.textContent, 'world');
});

// --- Stateful component patches ---

patchTest.addTest('stateful: patch re-invokes render fn', () => {
  let count = 0;
  function Counter() { return () => V('div', String(count)); }
  const l = L(V(Counter));
  assertEqual(l.el.textContent, '0');
  count = 5;
  patch(l, l.vnode);
  assertEqual(l.el.textContent, '5');
});

patchTest.addTest('stateful: render fn returns different tag type — self.el updated', () => {
  let showSpan = false;
  function Switcher() { return () => showSpan ? V('span', 'b') : V('div', 'a'); }
  const l = L(V(Switcher));
  mount(l, document.body);
  assertEqual(l.el.tagName, 'DIV');
  showSpan = true;
  patch(l, l.vnode);
  assertEqual(l.el.tagName, 'SPAN');
  assert(document.body.contains(l.el));
  unmount(l);
});

patchTest.addTest('stateful: prop change in render output, no el swap', () => {
  let cls = 'foo';
  function Styled() { return () => V('div', { class: cls }); }
  const l = L(V(Styled));
  const originalEl = l.el;
  cls = 'bar';
  patch(l, l.vnode);
  assertEqual(l.el, originalEl);
  assertEqual(l.el.className, 'bar');
});

patchTest.addTest('different stateful component type: full replace', () => {
  function A() { return () => V('div', 'A'); }
  function B() { return () => V('div', 'B'); }
  const l = L(V(A));
  mount(l, document.body);
  const result = patch(l, V(B));
  assertNotEqual(result, l);
  assertEqual(result.el.textContent, 'B');
  unmount(result);
});

// --- Lifecycle in patch ---

patchTest.addTest('full replace: onUnmount fires on old self', () => {
  let unmounted = false;
  const l = L(V('div', { $onUnmount() { unmounted = true; } }));
  mount(l, document.body);
  const result = patch(l, V('span'));
  assert(unmounted);
  unmount(result);
});

patchTest.addTest('full replace: onCreate fires on new self', () => {
  let created = false;
  const l = L(V('div'));
  mount(l, document.body);
  const result = patch(l, V('span', { $onCreate() { created = true; } }));
  assert(created);
  unmount(result);
});

patchTest.addTest('full replace: onMount fires on new self', () => {
  let mounted = false;
  const l = L(V('div'));
  mount(l, document.body);
  const result = patch(l, V('span', { $onMount() { mounted = true; } }));
  assert(mounted);
  unmount(result);
});

patchTest.addTest('in-place patch: no lifecycle events fire', () => {
  let fired = false;
  const l = L(V('div', { $onMount() { fired = true; } }));
  mount(l, document.body);
  fired = false;
  patch(l, V('div', { id: 'new' }));
  assert(!fired);
  unmount(l);
});

patchTest.addTest('new child from diffing: onMount fires after DOM insertion', () => {
  let elWasInDOM = false;
  const l = L(V('div'));
  mount(l, document.body);
  patch(l, V('div',
    V('span', { id: 'span-id', $onMount(self) { elWasInDOM = Boolean(document.getElementById(self.el.id)) } }),
  ));
  console.log(elWasInDOM);
  assert(elWasInDOM);
  unmount(l);
});

patchTest.addTest('removed child from diffing: onUnmount fires', () => {
  let unmounted = false;
  const l = L(V('div', V('span', { $onUnmount() { unmounted = true; } })));
  mount(l, document.body);
  patch(l, V('div'));
  assert(unmounted);
  unmount(l);
});

patchTest.addTest('keyed reorder: no lifecycle events fire', () => {
  let fired = false;
  const fn = () => { fired = true; };
  const l = L(V('div',
    V('span', { key: 'a', $onMount: fn, $onUnmount: fn }),
    V('span', { key: 'b', $onMount: fn, $onUnmount: fn }),
  ));
  mount(l, document.body);
  fired = false;
  patch(l, V('div',
    V('span', { key: 'b' }),
    V('span', { key: 'a' }),
  ));
  assert(!fired);
  unmount(l);
});

// --- Return value ---

patchTest.addTest('in-place patch returns same self reference', () => {
  const l = L(V('div'));
  const result = patch(l, V('div', { id: 'new' }));
  assertEqual(result, l);
});

patchTest.addTest('full replace returns new self (different reference)', () => {
  const l = L(V('div'));
  mount(l, document.body);
  const result = patch(l, V('span'));
  assertNotEqual(result, l);
  unmount(result);
});

patchTest.addTest('child diffing captures new self from patch return value', () => {
  const l = L(V('div', V('span')));
  mount(l, document.body);
  patch(l, V('div', V('p')));
  assertEqual(l.children[0].el.tagName, 'P');
  unmount(l);
});

// --- update() method ---

patchTest.addTest('update() re-renders stateless component with new props', () => {
  function Greeting({ name = 'world' } = {}) {
    return V('div', `Hello, ${name}!`);
  }
  const l = L(V(Greeting));
  assertEqual(l.el.textContent, 'Hello, world!');
  l.update({ name: 'Alice' });
  assertEqual(l.el.textContent, 'Hello, Alice!');
});

patchTest.addTest('update() re-renders stateful component', () => {
  let value = 'initial';
  function MyComp() { return () => V('div', value); }
  const l = L(V(MyComp));
  assertEqual(l.el.textContent, 'initial');
  value = 'updated';
  l.update();
  assertEqual(l.el.textContent, 'updated');
});

patchTest.addTest('update() on tag node is a silent no-op', () => {
  const l = L(V('div', { id: 'original' }));
  assertDoesNotThrow(() => l.update({ id: 'changed' }));
  assertEqual(l.el.id, 'original');
});

// --- Edge / regression cases ---

patchTest.addTest('patch with identical vnode object: no-op', () => {
  const vnode = V('div', { id: 'same' });
  const l = L(vnode);
  const originalEl = l.el;
  patch(l, vnode);
  assertEqual(l.el, originalEl);
  assertEqual(l.el.id, 'same');
});

patchTest.addTest('multiple sequential patches reflect latest state', () => {
  const l = L(V('div', { id: 'v1' }));
  patch(l, V('div', { id: 'v2' }));
  patch(l, V('div', { id: 'v3' }));
  patch(l, V('div', { id: 'v4' }));
  assertEqual(l.el.id, 'v4');
});

patchTest.addTest('deeply nested patch updates correct node', () => {
  const l = L(V('div', V('section', V('span', { id: 'deep' }))));
  patch(l, V('div', V('section', V('span', { id: 'updated' }))));
  assertEqual(l.el.querySelector('#updated').id, 'updated');
  assertEqual(l.el.querySelector('#deep'), null);
});

patchTest.addTest('keyed diffing works correctly after a previous patch', () => {
  const l = L(V('div', V('span', { key: 'a', id: 'a1' })));
  mount(l, document.body);
  patch(l, V('div', V('span', { key: 'a', id: 'a2' })));
  assertEqual(l.el.children[0].id, 'a2');
  patch(l, V('div',
    V('span', { key: 'b', id: 'b1' }),
    V('span', { key: 'a', id: 'a3' }),
  ));
  assertEqual(l.el.children.length, 2);
  assertEqual(l.el.children[0].id, 'b1');
  assertEqual(l.el.children[1].id, 'a3');
  unmount(l);
});

patchTest.addTest('stateful component whose render returns a stateless component', () => {
  function Inner({ label }) { return V('span', label); }
  let label = 'first';
  function Outer() { return () => V(Inner, { label }); }
  const l = L(V(Outer));
  assertEqual(l.el.textContent, 'first');
  label = 'second';
  patch(l, l.vnode);
  assertEqual(l.el.textContent, 'second');
});

patchTest.runTests();
