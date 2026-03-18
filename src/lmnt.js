const attrAliases = {
  'class': 'className',
  'for': 'htmlFor',
};

const propAliases = {
  'className': 'class',
  'htmlFor': 'for',
};

function isPrimitive(val) {
  if (val === null) return true;
  const type = typeof val;
  return type !== 'object' && type !== 'function';
}

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

function applyCssObj(cssObj, el) {
  for (const cssProp of Object.keys(cssObj)) {
    el.style[cssProp] = cssObj[cssProp];
  }
  return el;
}

// virtual node creator
// children are other vnodes, strings, or numbers
export function V(type, props = {}, ...children) {
  // Treat `props` as another child if applicable
  if (
    props._isVnode ||
    isPrimitive(props) ||
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
    else if (prop.startsWith('on')) {
      // Standardize event props by keeping them lowercase
      cleanProps[prop.toLowerCase()] = val;
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
  // Primitive values
  if (isPrimitive(vnode)) {
    return {
      el: document.createTextNode(vnode),
      hooks: {},
      events: {},
      vnode: {
        type: 'text',
        content: vnode,
      }
    };
  }

  // Unwrap component functions
  while (typeof vnode.type === 'function') {
    const nextVnode = vnode.type({ ...vnode.props, children: vnode.children });
    nextVnode.hooks = composeHooks(vnode.hooks, nextVnode.hooks);
    vnode = nextVnode;
  }

  const self = {
    vnode,
    el: document.createElement(vnode.type),
    children: [],
    props: {...vnode.props},
    hooks: Object.fromEntries(
      Object.entries(vnode.hooks).map(([hook, fns]) => [hook, [...fns]])
    ),
    handleEvent(e) {
      const type = e.type;
      const handler = this.vnode.props['on' + type];
      if (handler) {
        handler(e, this);
      }
    }
  };

  for (const prop in vnode.props) {
    patchProp(self.el, prop, null, vnode.props[prop], self);
  }

  vnode.children.forEach(child => {
    const childL = L(child);
    self.children.push(childL);
    self.el.appendChild(childL.el);
  });
  
  // onCreate lifecycle (after child L calls = bottom-up)
  vnode.hooks.onCreate?.forEach(fn => { fn(self) });

  return self;
}


function runMountLifecycle(self) {
  // Run children's onMount first (bottom-up)
  for (const child of self.children || []) {
    runMountLifecycle(child);
  }
  self.hooks.onMount?.forEach(fn => { fn(self) });
}

export function mount(self, container) {
  container.appendChild(self.el);
  runMountLifecycle(self);
}

function runUnmountLifecycle(self) {
  // Run children's onUnmount first (bottom-up)
  for (const child of self.children || []) {
    runUnmountLifecycle(child);
  }
  self.hooks.onUnmount?.forEach(fn => { fn(self) });
}

export function unmount(self) {
  runUnmountLifecycle(self);
  self.el.remove();
}

// Efficiently updates a prop
function patchProp(el, prop, prev, next, self) {
  if (prop.startsWith("on")) {
    const eName = prop.slice(2).toLowerCase();
    if (!prev && next) {
      el.addEventListener(eName, self);
    }
    else if (prev && !next) {
      el.removeEventListener(eName, self);
    }
  }

  else if (prop === 'style') {
    if (typeof next === 'string') {
      el.style.cssText = next;
    }
    else if (typeof next === 'object') {
      if (prev) {
        // Remove current props not present in `next`
        for (const cssP in prev) {
          if (!(cssP in next)) {
            el.style[cssP] = '';
          }
        }
      }
      // Apply all `next` CSS props
      applyCssObj(next, el);
    }
    else {
      el.style.cssText = '';
    }
  }

  else {
    prop = attrAliases[prop] || prop;
    const attr = propAliases[prop] || prop;

    console.log(el, prop, attr, prop in el);

    if (next == null) {
      el.removeAttribute(attr);
    }

    else if (prop in el) {
      if (el[prop] !== next) {
        el[prop] = next;
      }
    }

    else {
      el.setAttribute(attr, next);
    }
  }
}

// ************************
// WIP, not working yet
// ************************
// Patch element with new v-node
export function patch(self, newVnode) {
  // 1. node type: replace entirely
  if (self.vnode.type !== newVnode.type) {
    const newSelf = L(newVnode);
    // Replace old with new and clean up the old
    self.el.replaceWith(newSelf.el);
    unmount(self);

    // Run new element's setup
    runMountLifecycle(newSelf);

    return newSelf;
  }

  // 2. Props
  const oldProps = self.props;
  const newProps = nextVnode.props;

  for (const prop in oldProps) {
    if (!(prop in newProps)) {}
  }
}

