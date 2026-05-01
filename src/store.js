// Simple Redux imitation (based on the Redux website)
export function createStore(reducer, initialState, { equals = Object.is } = {}) {

  const listeners = new Set();
  const subscribe = (listener) => {
    listeners.add(listener);
    // Unsubscribe function
    return () => listeners.delete(listener);
  }

  let state;
  const getState = () => state;

  // single reducer
  if (typeof reducer === 'function') {
    state = initialState;

    return {
      getState,
      subscribe,
      dispatch(action) {
        const next = reducer(state, action);
        if (equals(next, state)) return;
        state = next;
        listeners.forEach(l => l(state, action));
      }
    };
  }

  // multiple reducers (slices)
  if (typeof reducer === 'object') {
    // rename the `reducer` parameter
    const slices = reducer;

    const sliceNames = Object.keys(slices);
    state = {};
    const reducers = {};
    const sliceEquals = {};

    for (const name of sliceNames) {
      reducers[name] = slices[name].reducer;
      state[name] = slices[name].state;
      sliceEquals[name] = slices[name].equals ?? Object.is;
    }

    return {
      getState,
      subscribe,
      dispatch(action) {
        let changed = false;
        for (const name of sliceNames) {
          const next = reducers[name](state[name], action);
          if (!sliceEquals[name](next, state[name])) {
            state[name] = next;
            changed = true;
          }
        }
        if (changed) listeners.forEach(l => l(state, action));
      }
    }
  }
}
