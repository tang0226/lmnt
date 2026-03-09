const propAliases = {
  'class': 'className',
  'for': 'htmlFor',
};

function composeHooks(outerHooks, innerHooks) {
  const res = {};
  for (const [hook, fns] of Object.entries(innerHooks)) {
    res[hook] = [...fns];
  }

  for (const [hook, fns] of Object.entries(outerHooks)) {
    if (res[hook]) {
      // Combine, putting inner hooks first
      res[hook] = [...res[hook], ...fns];
    }
    else {
      res[hook] = [...fns];
    }
  }

  return res;
}

// virtual node creator
// children are other vnodes, strings, or numbers
export function V(type, props = {}, ...children) {
  // Treat `props` as another child if applicable
  if (
    props._isVnode ||
    typeof props === 'string' ||
    typeof props === 'number' ||
    Array.isArray(props)
  ) {
    children.unshift(props);
    props = {};
  }

  // Split between props and hooks
  const hooks = {};
  const cleanProps = {};
  for (const [prop, val] of Object.entries(props)) {
    if (prop[0] === '$') {
      hooks[prop.slice(1)] = [val];
    }
    else {
      cleanProps[prop] = val;
    }
  }

  const childList = [];
  for (const child of children) {
    if (Array.isArray(child)) {
      for (const c of child) {
        childList.push(c);
      }
    }
    else {
      childList.push(child);
    }
  }

  return {
    type,
    props: cleanProps,
    hooks,
    children: childList,
    _isVnode: true,
  };
}

// Returns a new object that contains a newly created DOM element
export function L(vnode) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return { el: document.createTextNode(vnode) };
  }

  // Unwrap component functions
  while (typeof vnode.type === 'function') {
    const nextVnode = vnode.type({ ...vnode.props, children: vnode.children });
    nextVnode.hooks = composeHooks(vnode.hooks, nextVnode.hooks);
    vnode = nextVnode;
  }

  const el = document.createElement(vnode.type);  

  // Props
  const events = {};
  for (const [prop, val] of Object.entries(vnode.props)) {
    if (prop.startsWith("on") && prop[2] === prop[2].toUpperCase()) {
      events[prop.slice(2).toLowerCase()] = val;
    }
    // Style
    else if (prop === 'style') {
      if (typeof val === 'object') {
        for (const cssProp of Object.keys(val)) {
          el.style[cssProp] = val[cssProp];
        }
      }
      if (typeof val === 'string') {
        el.style.cssText = val;
      }
    }
    // Aliased props like `class` and `for`
    else if (propAliases[prop]) {
      el[propAliases[prop]] = val;
    }
    // All other props
    else {
      el[prop] = val;
    }
  }

  const children = [];

  const self = {
    el,
    props: vnode.props,
    hooks: vnode.hooks || {},
    children,
  };

  // Pass self as context to event listeners, since they are often defined
  // in V (on the vnode level, not the DOM element (L) level)
  self.events = {};
  for (const eName of Object.keys(events)) {
    const callback = (e) => {
      events[eName](e, self);
    }
    self.el.addEventListener(eName, callback);
    self.events[eName] = callback;
  }

  for (const child of vnode.children) {
    if (typeof child === 'string' || typeof child === 'number') {
      const tn = document.createTextNode(child);
      children.push(tn);
      el.appendChild(tn);
    }
    else {
      const childL = L(child);
      children.push(childL);
      el.appendChild(childL.el);
    }
  }
  
  // onCreate lifecycle (after child L calls = bottom-up)
  (vnode.hooks.onCreate || []).forEach(fn => { fn(self) });

  return self;
}


function runMountLifecycle(elObj) {
  // Run children's onMount first (bottom-up)
  for (const child of elObj.children || []) {
    if (child.el) {
      runMountLifecycle(child);
    }
  }
  (elObj.hooks.onMount || []).forEach(fn => { fn(elObj) });
}

export function mount(elObj, container) {
  container.appendChild(elObj.el);
  runMountLifecycle(elObj);
}

function runUnmountLifecycle(elObj) {
  // Run children's onUnmount first (bottom-up)
  for (const child of elObj.children || []) {
    if (child.el) {
      runUnmountLifecycle(child);
    }
  }
  (elObj.hooks.onUnmount || []).forEach(fn => { fn(elObj) });

  for (const [event, callback] of Object.entries(elObj.events)) {
    elObj.el.removeEventListener(event, callback);
  }
}

export function unmount(elObj) {
  runUnmountLifecycle(elObj);
  elObj.el.remove();
}
