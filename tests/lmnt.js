import { V, L, mount, unmount, patch, bindSignal, bindStore, signal, createStore, Fragment } from '../src/index.js';
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
} from '../assert-js/assert.js';
import { TestSuite } from '../assert-js/test-suite.js';

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
  let fn;
  function Counter() {
    fn = () => V('span', 'initial')
    return fn;
  }
  const l = L(V(Counter));
  assertType(l.render, 'function');
  assertEqual(l.render, fn);
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

lTest.addTest('unwraps stateless component returned by render function', () => {
  let count = 0;
  function Display({ value }) {
    return V('span', String(value));
  }
  function Counter() {
    return () => V(Display, { value: count });
  }
  const l = L(V(Counter));
  assertEqual(l.el.tagName, 'SPAN');
  assertEqual(l.el.textContent, '0');
});

lTest.addTest('patches through render fn returning a stateless component', () => {
  let count = 0;
  function Display({ value }) {
    return V('span', String(value));
  }
  function Counter() {
    return () => V(Display, { value: count });
  }
  const l = L(V(Counter));
  mount(l, document.body);
  count = 3;
  patch(l, l.vnode);
  assertEqual(l.el.textContent, '3');
  unmount(l);
});

lTest.addTest('creates fragment with anchor comment node', () => {
  const l = L(V(Fragment));
  assertEqual(l.el.nodeType, Node.COMMENT_NODE);
  assert(l.isFragment);
});

lTest.addTest('creates fragment children in children array', () => {
  const l = L(V(Fragment, null, V('span'), V('p')));
  assertEqual(l.children.length, 2);
  assertEqual(l.children[0].el.tagName, 'SPAN');
  assertEqual(l.children[1].el.tagName, 'P');
});

lTest.addTest('fragment inside element: children are DOM siblings', () => {
  const l = L(V('div', V(Fragment, null, V('span'), V('p'))));
  // div childNodes: span, p, comment
  const nodes = [...l.el.childNodes];
  assertEqual(nodes[0].tagName, 'SPAN');
  assertEqual(nodes[1].tagName, 'P');
  assertEqual(nodes[2].nodeType, Node.COMMENT_NODE);
});

lTest.addTest('component returning fragment: l.el is the anchor', () => {
  function Comp() {
    return V(Fragment, null, V('span', 'a'), V('span', 'b'));
  }
  const l = L(V(Comp));
  assertEqual(l.el.nodeType, Node.COMMENT_NODE);
});

lTest.addTest('mount() fragment: all children appended to container', () => {
  const l = L(V(Fragment, null, V('span', { id: 'f1' }), V('span', { id: 'f2' })));
  mount(l, document.body);
  assertDefined(document.getElementById('f1'));
  assertDefined(document.getElementById('f2'));
  unmount(l);
});

lTest.addTest('unmount() fragment: all children removed from DOM', () => {
  const l = L(V(Fragment, null, V('span', { id: 'g1' }), V('span', { id: 'g2' })));
  mount(l, document.body);
  unmount(l);
  assertEqual(document.getElementById('g1'), null);
  assertEqual(document.getElementById('g2'), null);
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

const bindStoreTest = new TestSuite('bindStore');

bindStoreTest.addTest('adds unsubscribe function to onUnmount hooks', () => {
  const store = createStore(s => s, {});
  const l = L(V('div'));
  bindStore(l, store);
  assertDefined(l.hooks.onUnmount);
  assertEqual(l.hooks.onUnmount.length, 1);
  assertType(l.hooks.onUnmount[0], 'function');
});

bindStoreTest.addTest('patches stateful component when store dispatches', () => {
  const store = createStore(
    (state, action) => action.type === 'SET' ? { value: action.payload } : state,
    { value: 'hello' }
  );
  function MyComponent() {
    return () => V('div', store.getState().value);
  }
  const l = L(V(MyComponent));
  mount(l, document.body);
  bindStore(l, store);
  assertEqual(l.el.textContent, 'hello');
  store.dispatch({ type: 'SET', payload: 'world' });
  assertEqual(l.el.textContent, 'world');
  unmount(l);
});

bindStoreTest.addTest('stops patching after unmount', () => {
  const store = createStore(
    (state, action) => action.type === 'SET' ? { value: action.payload } : state,
    { value: 'before' }
  );
  function MyComponent() {
    return () => V('div', store.getState().value);
  }
  const l = L(V(MyComponent));
  mount(l, document.body);
  bindStore(l, store);
  unmount(l);
  store.dispatch({ type: 'SET', payload: 'after' });
  assertEqual(l.el.textContent, 'before');
});

bindStoreTest.addTest('select: only rerenders when selected value changes', () => {
  const store = createStore(
    (state, action) =>
      action.type === 'SET_A' ? { ...state, a: action.payload } :
      action.type === 'SET_B' ? { ...state, b: action.payload } :
      state,
    { a: 'initial-a', b: 'initial-b' }
  );
  function MyComponent() {
    return () => V('div', store.getState().a);
  }
  const l = L(V(MyComponent));
  mount(l, document.body);
  bindStore(l, store, { select: s => s.a });
  store.dispatch({ type: 'SET_B', payload: 'changed-b' });
  assertEqual(l.el.textContent, 'initial-a');
  store.dispatch({ type: 'SET_A', payload: 'changed-a' });
  assertEqual(l.el.textContent, 'changed-a');
  unmount(l);
});

bindStoreTest.addTest('shouldUpdate: custom predicate suppresses re-render', () => {
  const store = createStore(
    (state, action) => action.type === 'SET' ? { value: action.payload } : state,
    { value: 'initial' }
  );
  function MyComponent() {
    return () => V('div', store.getState().value);
  }
  const l = L(V(MyComponent));
  mount(l, document.body);
  bindStore(l, store, { shouldUpdate: () => false });
  store.dispatch({ type: 'SET', payload: 'changed' });
  assertEqual(l.el.textContent, 'initial');
  unmount(l);
});

bindStoreTest.runTests();
