import { signal, computed, createStore, bindSignal, V, L, mount, unmount } from '../src/index.js';
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

const signalTest = new TestSuite('signal');

signalTest.addTest('creates object with get, set, and subscribe functions', () => {
  const sig = signal(0);
  assertType(sig.get, 'function');
  assertType(sig.set, 'function');
  assertType(sig.subscribe, 'function');
});

signalTest.addTest('get() returns initial value', () => {
  const sig = signal(42);
  assertEqual(sig.get(), 42);
});

signalTest.addTest('set() updates the value', () => {
  const sig = signal(0);
  sig.set(99);
  assertEqual(sig.get(), 99);
});

signalTest.addTest('set() notifies subscribers', () => {
  const sig = signal(0);
  let called = false;
  sig.subscribe(() => { called = true; });
  sig.set(1);
  assert(called);
});

signalTest.addTest('subscriber receives the new value', () => {
  const sig = signal(0);
  let received;
  sig.subscribe(val => { received = val; });
  sig.set(7);
  assertEqual(received, 7);
});

signalTest.addTest('subscribe() returns an unsubscribe function', () => {
  const sig = signal(0);
  const unsub = sig.subscribe(() => {});
  assertType(unsub, 'function');
});

signalTest.addTest('unsubscribed listeners are not called after unsubscribing', () => {
  const sig = signal(0);
  let callCount = 0;
  const unsub = sig.subscribe(() => { callCount++; });
  sig.set(1);
  assertEqual(callCount, 1);
  unsub();
  sig.set(2);
  assertEqual(callCount, 1);
});

signalTest.addTest('notifies all subscribers on set', () => {
  const sig = signal(0);
  let aCount = 0, bCount = 0;
  sig.subscribe(() => { aCount++; });
  sig.subscribe(() => { bCount++; });
  sig.set(1);
  assertEqual(aCount, 1);
  assertEqual(bCount, 1);
});

signalTest.addTest('unsubscribing one subscriber does not affect others', () => {
  const sig = signal(0);
  let aCount = 0, bCount = 0;
  const unsub = sig.subscribe(() => { aCount++; });
  sig.subscribe(() => { bCount++; });
  unsub();
  sig.set(1);
  assertEqual(aCount, 0);
  assertEqual(bCount, 1);
});

// --- Signal equals ---

signalTest.addTest('set() with same value does not notify subscribers', () => {
  const sig = signal(42);
  let notifyCount = 0;
  sig.subscribe(() => { notifyCount++; });
  sig.set(42);
  assertEqual(notifyCount, 0);
});

signalTest.addTest('set() with different value still notifies', () => {
  const sig = signal(42);
  let notifyCount = 0;
  sig.subscribe(() => { notifyCount++; });
  sig.set(43);
  assertEqual(notifyCount, 1);
});

signalTest.addTest('custom equals: no notification when considered equal', () => {
  const sig = signal({ x: 1 }, { equals: (a, b) => a.x === b.x });
  let notifyCount = 0;
  sig.subscribe(() => { notifyCount++; });
  sig.set({ x: 1, y: 99 });
  assertEqual(notifyCount, 0);
  sig.set({ x: 2 });
  assertEqual(notifyCount, 1);
});

signalTest.runTests();

// --- Computed ---

const computedTest = new TestSuite('computed');

computedTest.addTest('initial value is correct on creation', () => {
  const a = signal(3);
  const double = computed([a], () => a.get() * 2);
  assertEqual(double.get(), 6);
});

computedTest.addTest('updates when a signal dep changes', () => {
  const a = signal(3);
  const double = computed([a], () => a.get() * 2);
  a.set(5);
  assertEqual(double.get(), 10);
});

computedTest.addTest('notifies subscribers when derived value changes', () => {
  const a = signal(1);
  const double = computed([a], () => a.get() * 2);
  let received;
  double.subscribe(v => { received = v; });
  a.set(4);
  assertEqual(received, 8);
});

computedTest.addTest('does not notify subscribers when derived value is unchanged', () => {
  const a = signal(1);
  const parity = computed([a], () => a.get() % 2);
  let notifyCount = 0;
  parity.subscribe(() => { notifyCount++; });
  a.set(3); // 3 % 2 === 1, same as before
  assertEqual(notifyCount, 0);
  a.set(2); // 2 % 2 === 0, different
  assertEqual(notifyCount, 1);
});

computedTest.addTest('fn() not called when signal set to same value', () => {
  let callCount = 0;
  const a = signal(5);
  computed([a], () => { callCount++; return a.get(); });
  assertEqual(callCount, 1); // initial call only
  a.set(5);
  assertEqual(callCount, 1);
});

computedTest.addTest('works with multiple signal deps', () => {
  const a = signal(2);
  const b = signal(3);
  const sum = computed([a, b], () => a.get() + b.get());
  assertEqual(sum.get(), 5);
  a.set(10);
  assertEqual(sum.get(), 13);
  b.set(1);
  assertEqual(sum.get(), 11);
});

computedTest.addTest('works with a store dep', () => {
  const store = createStore(
    (state, action) => action.type === 'SET' ? { val: action.val } : state,
    { val: 1 }
  );
  const doubled = computed([store], () => store.getState().val * 2);
  assertEqual(doubled.get(), 2);
  store.dispatch({ type: 'SET', val: 5 });
  assertEqual(doubled.get(), 10);
});

computedTest.addTest('works with mixed signal and store deps', () => {
  const prefix = signal('Hello');
  const store = createStore(
    (state, action) => action.type === 'SET_NAME' ? { name: action.name } : state,
    { name: 'World' }
  );
  const greeting = computed([prefix, store], () =>
    `${prefix.get()}, ${store.getState().name}!`
  );
  assertEqual(greeting.get(), 'Hello, World!');
  prefix.set('Hi');
  assertEqual(greeting.get(), 'Hi, World!');
  store.dispatch({ type: 'SET_NAME', name: 'Alice' });
  assertEqual(greeting.get(), 'Hi, Alice!');
});

computedTest.addTest('custom equals suppresses notification when result considered equal', () => {
  const a = signal({ x: 1, y: 2 });
  const xOnly = computed(
    [a],
    () => ({ x: a.get().x }),
    { equals: (n, p) => n.x === p.x }
  );
  let notifyCount = 0;
  xOnly.subscribe(() => { notifyCount++; });
  a.set({ x: 1, y: 99 });
  assertEqual(notifyCount, 0);
  a.set({ x: 5, y: 0 });
  assertEqual(notifyCount, 1);
});

computedTest.addTest('compatible with bindSignal: re-renders when computed changes', () => {
  const base = signal(3);
  const double = computed([base], () => base.get() * 2);
  function Comp() { return () => V('div', String(double.get())); }
  const l = L(V(Comp));
  bindSignal(l, double);
  mount(l, document.body);
  assertEqual(l.el.textContent, '6');
  base.set(5);
  assertEqual(l.el.textContent, '10');
  unmount(l);
});

computedTest.addTest('chained computed: updates when root signal changes', () => {
  const a = signal(2);
  const doubled = computed([a], () => a.get() * 2);
  const quadrupled = computed([doubled], () => doubled.get() * 2);
  assertEqual(quadrupled.get(), 8);
  a.set(3);
  assertEqual(quadrupled.get(), 12);
});

computedTest.runTests();
