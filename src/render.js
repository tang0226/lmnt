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

  let prev = select(store.getState());
  
  const unsubscribe = store.subscribe((state, action) => {
    const next = select(state);

    if (shouldRender(next, prev, action)) {
      render(next, prev, action);
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
