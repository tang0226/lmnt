export function signal(initVal, { equals = Object.is } = {}) {
  let val = initVal;
  const subs = new Set();

  function get() {
    return val;
  }

  function set(newVal) {
    if (equals(newVal, val)) return;
    val = newVal;
    [...subs].forEach(sub => sub(val));
  }

  function subscribe(sub) {
    subs.add(sub);

    return () => {
      subs.delete(sub);
    };
  }

  return { get, set, subscribe };
}

export function computed(deps, fn, { equals = Object.is } = {}) {
  let val = fn();
  const subs = new Set();

  for (const dep of deps) {
    dep.subscribe(() => {
      const next = fn();
      if (!equals(next, val)) {
        val = next;
        [...subs].forEach(sub => sub(val));
      }
    });
  }

  return {
    get() { return val; },
    subscribe(sub) {
      subs.add(sub);
      return () => subs.delete(sub);
    },
  };
}
