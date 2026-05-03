import { V, L, mount, unmount, useState, useEffect } from '../src/index.js';
import {
  assertEqual,
  assertThrows,
} from '../assert-js/assert.js';
import { TestSuite } from '../assert-js/test-suite.js';

const suite = new TestSuite('hooks');

// useState

suite.addTest('useState returns a signal with the initial value', () => {
  let sig;
  function Comp() {
    sig = useState(42);
    return () => V('div');
  }
  L(V(Comp));
  assertEqual(sig.get(), 42);
});

suite.addTest('useState triggers re-render when signal changes', () => {
  const container = document.createElement('div');
  function Comp() {
    const count = useState(0);
    return () => V('div', String(count.get()));
  }
  let sig;
  function Wrapper() {
    sig = useState(0);
    return () => V('div', String(sig.get()));
  }
  const l = L(V(Wrapper));
  mount(l, container);
  assertEqual(container.querySelector('div').textContent, '0');
  sig.set(1);
  assertEqual(container.querySelector('div').textContent, '1');
  unmount(l);
});

suite.addTest('useState() outside initialization throws', () => {
  assertThrows(() => useState(0));
});

// useEffect

suite.addTest('useEffect runs on mount', () => {
  const container = document.createElement('div');
  let ran = false;
  function Comp() {
    useEffect(() => { ran = true; });
    return () => V('div');
  }
  const l = L(V(Comp));
  assertEqual(ran, false);
  mount(l, container);
  assertEqual(ran, true);
  unmount(l);
});

suite.addTest('useEffect cleanup runs on unmount', () => {
  const container = document.createElement('div');
  let cleanedUp = false;
  function Comp() {
    useEffect(() => () => { cleanedUp = true; });
    return () => V('div');
  }
  const l = L(V(Comp));
  mount(l, container);
  assertEqual(cleanedUp, false);
  unmount(l);
  assertEqual(cleanedUp, true);
});

suite.addTest('useEffect without cleanup return does not throw on unmount', () => {
  const container = document.createElement('div');
  function Comp() {
    useEffect(() => { /* no return */ });
    return () => V('div');
  }
  const l = L(V(Comp));
  mount(l, container);
  unmount(l);
});

suite.addTest('useEffect() outside initialization throws', () => {
  assertThrows(() => useEffect(() => {}));
});
