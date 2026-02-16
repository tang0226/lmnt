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

import { createStore } from '../../src/store.js';

const testSuite = new TestSuite('createStore');

testSuite.addTest('store object contains getState, subscribe, and dispatch functions', () => {
  // Single reducer
  var store = createStore((state, action) => state, {});
  assertEqual(typeof store.getState, 'function', 'single reducer: store.getState is not a function');
  assertEqual(typeof store.subscribe, 'function', 'single reducer: store.subscribe is not a function');
  assertEqual(typeof store.dispatch, 'function', 'single reducer: store.dispatch is not a function');

  // Multiple slices
  store = createStore({
    sliceA: { reducer: () => {}, state: {} },
    sliceB: { reducer: () => {}, state: {} },
  });

  assertEqual(typeof store.getState, 'function', 'multiple slices: store.getState is not a function');
  assertEqual(typeof store.subscribe, 'function', 'multiple slices: store.subscribe is not a function');
  assertEqual(typeof store.dispatch, 'function', 'multiple slices: store.dispatch is not a function');
});

testSuite.addTest('store.getState returns store state', () => {
  // Single reducer
  var store = createStore((state, action) => state, { val: 10 });
  assertDeepEqual(store.getState(), { val: 10 });

  // Multiple slices
  var store = createStore({
    sliceA: { reducer: () => {}, state: { valA: 10 }},
    sliceB: { reducer: () => {}, state: { valB: 100 }},
  });

  assertDeepEqual(
    store.getState(),
    { sliceA: { valA: 10 }, sliceB: { valB: 100 } },
    'multi-slice state didn\'t initialize properly'
  );
});

testSuite.addTest('store.dispatch applies reducer to state', () => {
  // Single reducer
  var store = createStore(
    (state, action) => {
      if (action.type == 'incr') {
        return { val: state.val + 1 };
      }
    },
    { val: 1 }
  );
  store.dispatch({ type: 'incr' });
  assertEqual(store.getState().val, 2, 'state was not changed by reducer during dispatch call');

  // Multiple slices
  var store = createStore({
    sliceA: {
      reducer: (state, action) => {
        return { valA: state.valA + 1 };
      },
      state: { valA: 10 }
    },
    sliceB: {
      reducer: (state, action) => {
        return { valB: state.valB + 2 };
      },
      state: { valB: 100 }
    },
  });
  store.dispatch({});
  assertEqual(store.getState().sliceA.valA, 11, 'slice state was not changed by reducer during dispatch call');
  assertEqual(store.getState().sliceB.valB, 102, 'slice state was not changed by reducer during dispatch call');
});

testSuite.addTest('subscribe adds listeners and dispatch executes them', () => {
  var store = createStore(
    (state, action) => {
      if (action.type == 'incr') {
        return { val: state.val + 1 };
      }
      if (action.type == 'decr') {
        return { val: state.val - 1 };
      }
    },
    { val: 0 }
  );
  var res1, res2;
  var unsub1 = store.subscribe((state, action) => {
    if (action.type == 'incr') res1 = state.val;
  });
  var unsub2 = store.subscribe((state, action) => {
    if (action.type == 'decr') res2 = state.val;
  });

  store.dispatch({ type: 'incr' });
  assertEqual(res1, 1);
  assertEqual(res2, undefined);

  store.dispatch({type: 'decr' });
  assertEqual(res1, 1);
  assertEqual(res2, 0);
});

testSuite.addTest('unsubscribe removes listener', () => {
  var store = createStore(() => {}, {});
  var updateCount = 0;
  var unsub = store.subscribe((state, action) => {
    updateCount++;
  });
  store.dispatch({});
  assertEqual(updateCount, 1);
  unsub();
  // updateCount should not change after unsubscribing
  store.dispatch({});
  assertEqual(updateCount, 1);
});



testSuite.runTests();