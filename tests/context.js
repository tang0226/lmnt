import { V, L, patch, mount, unmount, Fragment, bindSignal, provide, inject, getSelf } from '../src/index.js';
import { signal } from '../src/index.js';
import {
  assertEqual,
  assertThrows,
} from '../assert-js/assert.js';
import { TestSuite } from '../assert-js/test-suite.js';

const suite = new TestSuite('context');

suite.addTest('basic provide + inject in direct parent-child', () => {
  let injected;
  function Parent() {
    provide('color', 'red');
    return () => V(Child);
  }
  function Child() {
    injected = inject('color');
    return () => V('div');
  }
  L(V(Parent));
  assertEqual(injected, 'red');
});

suite.addTest('deep inject across multiple levels', () => {
  let injected;
  function GrandParent() {
    provide('color', 'blue');
    return () => V(Parent);
  }
  function Parent() {
    return () => V(Child);
  }
  function Child() {
    injected = inject('color');
    return () => V('div');
  }
  L(V(GrandParent));
  assertEqual(injected, 'blue');
});

suite.addTest('nearest ancestor wins', () => {
  let injected;
  function GrandParent() {
    provide('color', 'blue');
    return () => V(Parent);
  }
  function Parent() {
    provide('color', 'green');
    return () => V(Child);
  }
  function Child() {
    injected = inject('color');
    return () => V('div');
  }
  L(V(GrandParent));
  assertEqual(injected, 'green');
});

suite.addTest('inject returns defaultValue when no provider', () => {
  let injected;
  function Comp() {
    injected = inject('missing', 'fallback');
    return () => V('div');
  }
  L(V(Comp));
  assertEqual(injected, 'fallback');
});

suite.addTest('inject returns undefined with no default and no provider', () => {
  let injected = 'sentinel';
  function Comp() {
    injected = inject('missing');
    return () => V('div');
  }
  L(V(Comp));
  assertEqual(injected, undefined);
});

suite.addTest('symbol keys work', () => {
  const KEY = Symbol('key');
  let injected;
  function Parent() {
    provide(KEY, 42);
    return () => V(Child);
  }
  function Child() {
    injected = inject(KEY);
    return () => V('div');
  }
  L(V(Parent));
  assertEqual(injected, 42);
});

suite.addTest('provide() outside initialization throws', () => {
  assertThrows(() => provide('k', 'v'));
});

suite.addTest('inject() outside initialization throws', () => {
  assertThrows(() => inject('k'));
});

suite.addTest('getSelf() returns the correct L-node', () => {
  let captured;
  function Comp() {
    captured = getSelf();
    return () => V('div');
  }
  const l = L(V(Comp));
  assertEqual(captured, l);
});

suite.addTest('getSelf() outside initialization throws', () => {
  assertThrows(() => getSelf());
});

suite.addTest('reactive context: bindSignal on injected signal triggers re-render', () => {
  const container = document.createElement('div');
  const theme = signal('dark');

  function Parent() {
    provide('theme', theme);
    return () => V(Child);
  }
  function Child() {
    const t = inject('theme');
    bindSignal(t);
    return () => V('div', t.get());
  }

  const l = L(V(Parent));
  mount(l, container);
  assertEqual(container.querySelector('div').textContent, 'dark');

  theme.set('light');
  assertEqual(container.querySelector('div').textContent, 'light');

  unmount(l);
});

suite.addTest('component cannot inject its own provide', () => {
  let injected = 'sentinel';
  function Comp() {
    provide('k', 'own');
    injected = inject('k');
    return () => V('div');
  }
  L(V(Comp));
  assertEqual(injected, undefined);
});

suite.addTest('new nodes created during patchChildren can inject from ancestors', () => {
  const container = document.createElement('div');
  const items = signal([1]);
  let lastInjected;

  function Item() {
    lastInjected = inject('val');
    return () => V('div');
  }
  function Parent() {
    provide('val', 'ctx');
    return () => V('ul', items.get().map(i => V(Item, { key: i })));
  }

  const l = L(V(Parent));
  mount(l, container);
  assertEqual(lastInjected, 'ctx');

  lastInjected = undefined;
  items.set([1, 2]);
  assertEqual(lastInjected, 'ctx');

  unmount(l);
});

suite.addTest('fragment in ancestor chain is transparent', () => {
  let injected;
  function Parent() {
    provide('val', 'ok');
    return () => V(Fragment, null, V(Child));
  }
  function Child() {
    injected = inject('val');
    return () => V('div');
  }
  L(V(Parent));
  assertEqual(injected, 'ok');
});
