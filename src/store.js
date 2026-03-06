// Simple Redux imitation (based on the Redux website)
export function createStore(reducer, initialState) {

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
        state = reducer(state, action);
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
    
    for (const name of sliceNames) {
      reducers[name] = slices[name].reducer;
      state[name] = slices[name].state;
    }

    return {
      getState,
      subscribe,
      dispatch(action) {
        for (const name of sliceNames) {
          state[name] = reducers[name](state[name], action);
        }
        listeners.forEach(l => l(state, action));
      }
    }
  }
}

// Hook that automatically handles a store subscription and provides custom state selection and render control
export function withStore(
  elObj,
  store,
  {
    select = s => s,
    shouldRender = ({ next, prev, action }) =>
      prev !== next,
    render
  } = {}
) {

  let prev = select(store.getState());
  
  const unsubscribe = store.subscribe((state, action) => {
    const next = select(state);

    if (shouldRender({ next, prev, action })) {
      render({ next, prev, action });
      prev = next;
    }
  });

  // Add unsubscribe call to unmount callback
  const prevUnmount = elObj.hooks.onUnmount;
  elObj.hooks.onUnmount = (self) => {
    unsubscribe?.();
    prevUnmount?.(self);
  };
}
