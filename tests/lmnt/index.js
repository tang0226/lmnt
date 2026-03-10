import { V, L, mount, unmount } from '../../../src/lmnt.js';
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

lTest.addTest('maps `for` to `htmlFor', () => {
  const l = L(V('div', { for: 'id' }));
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

lTest.runTests();

const mountTest = new TestSuite('mount');

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

unmountTest.addTest('unmount() removes event listeners', () => {
  let count = 0;

  const l = L(V('button', {
    onClick() { count++ }
  }));

  mount(l, document.body);
  unmount(l);

  l.el.click();

  assertEqual(count, 0);
});

unmountTest.runTests();
