import { V, L, mount, unmount, patch, bindSignal } from '../../../src/lmnt.js';
import { signal } from '../../../src/signal.js';
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
} from '../../test-framework/assert.js';
import { TestSuite } from '../../test-framework/test-suite.js';

const vTest = new TestSuite('V');

vTest.addTest('creates a vnode with type, props, and children', () => {
  const vnode = V('div', { id: 'div-id' }, 'hello world');

  assertEqual(vnode.type, 'div');
  assertDeepEqual(vnode.props, { id: 'div-id' });
  assertDeepEqual(vnode.children, ['hello world']);
  assertEqual(vnode._isVnode, true);
});

vTest.addTest('extracts `$` hook props into `hooks`', () => {
  const fn = () => {};
  const vnode = V('div', { $onCreate: fn, id: 'div-id' });
  assertDeepEqual(vnode.hooks.onCreate, [fn]);
  assertDeepEqual(vnode.props, { id: 'div-id' });
});

vTest.addTest('stores multiple hook types', () => {
  const c = () => {};
  const m = () => {};

  const vnode = V('div', {
    $onCreate: c,
    $onMount: m,
  });

  assertDeepEqual(vnode.hooks.onCreate, [c]);
  assertDeepEqual(vnode.hooks.onMount, [m]);
});

vTest.addTest('props treated as child when props is a primitive', () => {
  let vnode = V('div', 'hello world');

  assertDeepEqual(vnode.props, {});
  assertDeepEqual(vnode.children, ['hello world']);

  vnode = V('div', 0);
  assertDeepEqual(vnode.props, {});
  assertDeepEqual(vnode.children, [0]);
});

vTest.addTest('treats vnode props as child', () => {
  const child = V('div');
  const vnode = V('div', child);

  assertDeepEqual(vnode.children, [child]);
});

vTest.addTest('accepts multiple children', () => {
  const vnode = V('div', 'c1', 'c2', 3);
  assertDeepEqual(vnode.children, ['c1', 'c2', 3]);
});

vTest.addTest('flattens child arrays', () => {
  const vnode = V('div', {}, ['a', 'b'], ['c', 'd']);
  assertDeepEqual(vnode.children, ['a', 'b', 'c', 'd']);
});

vTest.addTest('treats props array as array of children', () => {
  const vnode = V('div', ['a', 'b'], ['c', 'd']);
  assertDeepEqual(vnode.children, ['a', 'b', 'c', 'd']);
});

vTest.addTest('creates empty hooks when none are provided', () => {
  const vnode = V('div', { id: 'div-id' });
  assertDeepEqual(vnode.hooks, {});
});

vTest.addTest('normalizes event prop names to lowercase', () => {
  const handler = () => {};
  const vnode = V('div', { onClick: handler, onMouseEnter: handler });
  assertDefined(vnode.props.onclick);
  assertDefined(vnode.props.onmouseenter);
  assertEqual(vnode.props.onClick, undefined);
  assertEqual(vnode.props.onMouseEnter, undefined);
});

vTest.runTests();

const lTest = new TestSuite('L');

lTest.addTest('creates DOM element', () => {
  const l = L(V('div'));
  assert(l.el instanceof HTMLElement);
  assertEqual(l.el.tagName, 'DIV');
});

lTest.addTest('creates text node for string vnode', () => {
  const l = L('hello');

  assertEqual(l.el.nodeType, Node.TEXT_NODE);
  assertEqual(l.el.textContent, 'hello');
});

lTest.addTest('applies props to element', () => {
  const l = L(V('input', { type: 'text', 'value': 'hello' }));
  assertEqual(l.el.type, 'text');
  assertEqual(l.el.value, 'hello');
});

lTest.addTest('maps `class` to `className', () => {
  const l = L(V('div', { class: 'class-name' }));
  assertEqual(l.el.className, 'class-name');
});

lTest.addTest('maps `for` to `htmlFor`', () => {
  const l = L(V('label', { for: 'id' }));
  assertEqual(l.el.htmlFor, 'id');
});

lTest.addTest('applies style object', () => {
  const l = L(V('div', { style: { color: 'red' } }));
  assertEqual(l.el.style.color, 'red');
});

lTest.addTest('applies style string', () => {
  const l = L(V('div', { style: 'color: red; background: blue' }));
  assertEqual(l.el.style.color, 'red');
  assertEqual(l.el.style.background, 'blue');
});

lTest.addTest('creates child DOM nodes', () => {
  const l = L(
    V('div', {},
      V('span'),
      V('p')
    )
  );
  assertEqual(l.el.children.length, 2);
});

lTest.addTest('creates text children', () => {
  const l = L(
    V('div', {}, 'hello', ' world!'),
  );

  assertEqual(l.el.textContent, 'hello world!');
});

lTest.addTest('unwraps component function', () => {
  function Comp() {
    return V('div', { id: 'test'});
  }
  const l = L(V(Comp))

  assertEqual(l.el.id, 'test');
});

lTest.addTest('unwraps multiple component functions', () => {
  function Inner({ children }) {
    return V('div', children, '!');
  }
  function Outer({ children }) {
    return V(Inner, 'Hello, ', children);
  }

  const l = L(V(Outer, 'John'));
  
  assertEqual(l.el.textContent, 'Hello, John!');
});

lTest.addTest('passes props to component function', () => {
  function Comp({ children, ...props } = {}) {
    return V('div', props, 'Hello');
  }

  const l = L(V(Comp, { id: 'comp-id' }));

  assertEqual(l.el.id, 'comp-id');
});

lTest.addTest('passes children to component function', () => {
  function Comp({ children} = {}) {
    return V('div', 'Hello, ', children);
  }

  const l = L(V(Comp, 'John', ' Doe'));

  assertEqual(l.el.textContent, 'Hello, John Doe');
});

lTest.addTest('attaches event listeners', () => {
  let called = false;
  const l = L(V('button', {
    onClick: () => { called = true }
  }));

  l.el.click();

  assert(called);
});

lTest.addTest('passes self object to events', () => {
  let receivedSelf;
  const l = L(V('button', {
    onClick: (e, self) => { receivedSelf = self }
  }));

  l.el.click();

  assertEqual(l, receivedSelf);
});


lTest.addTest('runs onCreate lifecycle', () => {
  let run = false;

  L(V('div', {
    $onCreate() { run = true }
  }));

  assert(run);
});

lTest.addTest('runs onCreate after initializing children (bottom-up, inside-out order)', () => {
  let childCount;
  const order = [];
  L(V('div', {
    $onCreate(self) {
      childCount = self.children.length;
      order.push('parent')
    }
  },
    V('span', { $onCreate: () => { order.push('child') } })
  ));

  assertEqual(childCount, 1);
  assertDeepEqual(order, ['child', 'parent']);
});

lTest.addTest('runs onCreate bottom-up/inside-out for nested component calls', () => {
  const order = [];
  function Inner() {
    return V('div', { $onCreate: () => { order.push('inner') } });
  }
  function Outer() {
    return V(Inner, { $onCreate: () => { order.push('outer') } });
  }

  L(V(Outer));
  assertDeepEqual(order, ['inner', 'outer']);
});

lTest.addTest('detects stateful component and stores render function on self', () => {
  function Counter() {
    return () => V('span', 'initial');
  }
  const l = L(V(Counter));
  assertType(l.renderFn, 'function');
});

lTest.addTest('calls render function for initial output of stateful component', () => {
  let count = 0;
  function Counter() {
    return () => V('div', String(count));
  }
  const l = L(V(Counter));
  assertEqual(l.el.tagName, 'DIV');
  assertEqual(l.el.textContent, '0');
});

lTest.runTests();

const mountTest = new TestSuite('mount');

mountTest.addTest('mount() appends element to container', () => {
  const l = L(V('div', { id: 'mount-test' }));
  mount(l, document.body);
  assertEqual(document.getElementById('mount-test'), l.el);
  unmount(l);
});

mountTest.addTest('mount() triggers onMount', () => {
  let mounted = false;

  const l = L(V('div', {
    $onMount() { mounted = true }
  }));

  mount(l, document.body);

  assert(mounted);
});

mountTest.addTest('onMount runs child before parent', () => {
  const order = [];

  const l = L(
    V('div', {
      $onMount() { order.push('parent') }
    },
      V('span', {
        $onMount() { order.push('child') }
      })
    )
  );

  mount(l, document.body);

  assertDeepEqual(order, ['child', 'parent']);
});

mountTest.runTests();

const unmountTest = new TestSuite('unmount');

unmountTest.addTest('unmount() removes element from DOM', () => {
  const l = L(V('button', { id: 'test-btn' }));
  
  mount(l, document.body);
  assertEqual(document.getElementById('test-btn'), l.el);
  
  unmount(l);
  assertEqual(document.getElementById('test-btn'), null);
});

unmountTest.addTest('unmount() runs onUnmount', () => {
  let unmounted = false;

  const l = L(V('div', {
    $onUnmount() { unmounted = true }
  }));

  mount(l, document.body);
  unmount(l);

  assert(unmounted);
});

unmountTest.addTest('onUnmount runs child before parent', () => {
  const order = [];

  const l = L(
    V('div', {
      $onUnmount() { order.push('parent') }
    },
      V('span', {
        $onUnmount() { order.push('child') }
      })
    )
  );

  mount(l, document.body);
  unmount(l);

  assertDeepEqual(order, ['child', 'parent']);
});


unmountTest.runTests();

const patchTest = new TestSuite('patch');

patchTest.addTest('updates text node content in place', () => {
  const l = L('hello');
  patch(l, 'world');
  assertEqual(l.el.nodeValue, 'world');
  assertEqual(l.vnode.content, 'world');
});

patchTest.addTest('replaces element with text node', () => {
  const l = L(V('div'));
  mount(l, document.body);
  const newSelf = patch(l, 'hello');
  assertEqual(newSelf.el.nodeType, Node.TEXT_NODE);
  assertEqual(newSelf.el.nodeValue, 'hello');
  unmount(newSelf);
});

patchTest.addTest('replaces element with null text node', () => {
  const l = L(V('div'));
  mount(l, document.body);
  const newSelf = patch(l, null);
  assertEqual(newSelf.el.nodeType, Node.TEXT_NODE);
  unmount(newSelf);
});

patchTest.addTest('replaces text node with element', () => {
  const l = L('hello');
  mount(l, document.body);
  const newSelf = patch(l, V('span', { id: 'replaced' }));
  assertEqual(newSelf.el.tagName, 'SPAN');
  assertTruthy(document.body.contains(newSelf.el));
  unmount(newSelf);
});

patchTest.addTest('adds new prop', () => {
  const l = L(V('div'));
  patch(l, V('div', { id: 'new-id' }));
  assertEqual(l.el.id, 'new-id');
});

patchTest.addTest('removes prop no longer in new vnode', () => {
  const l = L(V('div', { id: 'old-id' }));
  patch(l, V('div'));
  assertEqual(l.el.id, '');
});

patchTest.addTest('updates changed prop', () => {
  const l = L(V('input', { value: 'old' }));
  patch(l, V('input', { value: 'new' }));
  assertEqual(l.el.value, 'new');
});

patchTest.addTest('removes stale CSS properties when patching style object', () => {
  const l = L(V('div', { style: { color: 'red', background: 'blue' } }));
  patch(l, V('div', { style: { color: 'red' } }));
  assertEqual(l.el.style.background, '');
  assertEqual(l.el.style.color, 'red');
});

patchTest.addTest('calls updated event handler after patch', () => {
  let oldCalled = false, newCalled = false;
  const l = L(V('button', { onclick: () => { oldCalled = true; } }));
  patch(l, V('button', { onclick: () => { newCalled = true; } }));
  l.el.click();
  assert(!oldCalled);
  assert(newCalled);
});

patchTest.addTest('attaches event listener when event prop is added', () => {
  let called = false;
  const l = L(V('button'));
  patch(l, V('button', { onclick: () => { called = true; } }));
  l.el.click();
  assert(called);
});

patchTest.addTest('detaches event listener when event prop is removed', () => {
  let called = false;
  const l = L(V('button', { onclick: () => { called = true; } }));
  patch(l, V('button'));
  l.el.click();
  assert(!called);
});

patchTest.addTest('patches existing children by index', () => {
  const l = L(V('div', {}, V('span', { id: 'a' })));
  patch(l, V('div', {}, V('span', { id: 'b' })));
  assertEqual(l.el.firstElementChild.id, 'b');
  assertEqual(l.children.length, 1);
});

patchTest.addTest('mounts new children and runs onMount when list grows', () => {
  let mounted = false;
  const l = L(V('div', {}, V('span')));
  mount(l, document.body);
  patch(l, V('div', {},
    V('span'),
    V('p', { $onMount() { mounted = true; } })
  ));
  assertEqual(l.el.children.length, 2);
  assertEqual(l.el.children[1].tagName, 'P');
  assert(mounted);
  unmount(l);
});

patchTest.addTest('unmounts children and runs onUnmount when list shrinks', () => {
  let unmounted = false;
  const l = L(V('div', {},
    V('span'),
    V('p', { $onUnmount() { unmounted = true; } })
  ));
  mount(l, document.body);
  patch(l, V('div', {}, V('span')));
  assertEqual(l.el.children.length, 1);
  assert(unmounted);
  unmount(l);
});

patchTest.addTest('replaces element and swaps it in the DOM when node type changes', () => {
  const l = L(V('div'));
  mount(l, document.body);
  const newSelf = patch(l, V('span'));
  assertEqual(newSelf.el.tagName, 'SPAN');
  assertTruthy(document.body.contains(newSelf.el));
  unmount(newSelf);
});

patchTest.addTest('runs onUnmount on old element and onMount on new when type changes', () => {
  const order = [];
  const l = L(V('div', { $onUnmount() { order.push('unmount'); } }));
  mount(l, document.body);
  const newSelf = patch(l, V('span', { $onMount() { order.push('mount'); } }));
  assertDeepEqual(order, ['unmount', 'mount']);
  unmount(newSelf);
});

patchTest.addTest('re-renders stateful component via render function', () => {
  let count = 0;
  function Counter() {
    return () => V('div', String(count));
  }
  const l = L(V(Counter));
  mount(l, document.body);
  assertEqual(l.el.textContent, '0');
  count = 1;
  patch(l, l.vnode);
  assertEqual(l.el.textContent, '1');
  unmount(l);
});

patchTest.addTest('returns self when patching in place', () => {
  const l = L(V('div'));
  const result = patch(l, V('div', { id: 'patched' }));
  assertEqual(result, l);
});

patchTest.addTest('returns new self when element type changes', () => {
  const l = L(V('div'));
  mount(l, document.body);
  const result = patch(l, V('span'));
  assertNotEqual(result, l);
  assertEqual(result.el.tagName, 'SPAN');
  unmount(result);
});

patchTest.runTests();

// Integration: bindSignal combines the lmnt L-object lifecycle with the signal interface
const bindSignalTest = new TestSuite('bindSignal');

bindSignalTest.addTest('adds unsubscribe function to onUnmount hooks', () => {
  const sig = signal(0);
  const l = L(V('div'));
  bindSignal(l, sig);
  assertDefined(l.hooks.onUnmount);
  assertEqual(l.hooks.onUnmount.length, 1);
  assertType(l.hooks.onUnmount[0], 'function');
});

bindSignalTest.addTest('patches stateful component when signal changes', () => {
  const sig = signal('hello');
  function MyComponent() {
    return () => V('div', sig.get());
  }
  const l = L(V(MyComponent));
  mount(l, document.body);
  bindSignal(l, sig);
  assertEqual(l.el.textContent, 'hello');
  sig.set('world');
  assertEqual(l.el.textContent, 'world');
  unmount(l);
});

bindSignalTest.addTest('stops patching after unmount', () => {
  const sig = signal('before');
  function MyComponent() {
    return () => V('div', sig.get());
  }
  const l = L(V(MyComponent));
  mount(l, document.body);
  bindSignal(l, sig);
  unmount(l);
  sig.set('after');
  assertEqual(l.el.textContent, 'before');
});

bindSignalTest.runTests();
