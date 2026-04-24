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

signalTest.runTests();
