// Hook that adds automatic re-rendering (based on a store), custom state selection,
// render conditions, and render functions
export function withRender(
  elObj,
  store,
  {
    select = s => s,
    shouldRender = (next, prev, action) =>
      prev !== next,
    render
  } = {}
) {

  let prev;
  let unsubscribe;
  
  // Combine with any current onMount function on the elObj
  let prevMount = elObj.hooks.onMount;

  elObj.hooks.onMount = (self) => {
    prevMount?.(self);

    prev = select(store.getState());

    unsubscribe = store.subscribe((state, action) => {
      const next = select(state);

      if (shouldRender(next, prev, action)) {
        render(next, prev, action);
        prev = next;
      }
    });
  }

  // Combine with current onUnmount function
  let prevUnmount = elObj.hooks.onUnmount;
  elObj.hooks.onUnmount = (self) => {
    unsubscribe?.();
    prevUnmount?.(self);
  };
}
