// Simple Redux imitation (based on the Redux website)
export function createStore(reducer, initialState) {

  const listeners = [];
  const subscribe = (listener) => {
    listeners.push(listener);
    // Unsubscribe function
    return function unsubscribe() {
      const i = listeners.indexOf(listener);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  var state;
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
