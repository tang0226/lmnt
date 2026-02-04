// Simple Redux imitation (based on the Redux website)
export function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = [];

  return {
    getState() { return state; },
    dispatch(action) {
      state = reducer(state, action);
      listeners.forEach(l => l(state, action));
    },
    subscribe(listener) {
      listeners.push(listener);
      // Unsubscribe function
      return function unsubscribe() {
        const i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
      };
    }
  }
}
