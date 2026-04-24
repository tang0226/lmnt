export function signal(initVal) {
  let val = initVal;
  const subs = new Set();

  function get() {
    return val;
  }

  function set(newVal) {
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
