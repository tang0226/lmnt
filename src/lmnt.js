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
  let renderFn = null;
  let componentProps = null;

  while (typeof vnode.type === 'function') {
    const props = { ...vnode.props, children: vnode.children };
    const result = vnode.type(props);

    if (typeof result === 'function') {
      // Stateful component: initializer returned a render fn; call it once for the initial vnode
      renderFn = result;
      componentProps = props;
      const initialVnode = renderFn(props);
      initialVnode.hooks = composeHooks(vnode.hooks, initialVnode.hooks);
      vnode = initialVnode;
      break;
    }

    result.hooks = composeHooks(vnode.hooks, result.hooks);
    vnode = result;
  }

  const self = {
    vnode,
    el: document.createElement(vnode.type),
    children: [],
    hooks: Object.fromEntries(
      Object.entries(vnode.hooks).map(([hook, fns]) => [hook, [...fns]])
    ),
    renderFn,
    componentProps,
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

// Patch element with new v-node
export function patch(self, newVnode) {
  var { el } = self;

  // For stateful components: translate the component vnode (or signal trigger) to an inner vnode
  if (self.renderFn) {
    if (typeof newVnode.type === 'function') {
      self.componentProps = { ...newVnode.props, children: newVnode.children };
    }
    newVnode = self.renderFn(self.componentProps);
  }

  // Handle text node updates in-place
  if (self.vnode.type === 'text') {
    const content = isPrimitive(newVnode) ? newVnode : '';
    if (content !== self.vnode.content) {
      self.el.nodeValue = String(content);
      self.vnode = { type: 'text', content };
    }
    return self;
  }

  // 1. Different node type = replace entirely
  if (self.vnode.type !== newVnode.type) {
    const newSelf = L(newVnode);
    el.replaceWith(newSelf.el);
    unmount(self);
    runMountLifecycle(newSelf);
    return newSelf;
  }

  // 2. Props
  const oldProps = self.vnode.props || {};
  const newProps = newVnode.props || {};

  for (const prop in oldProps) {
    if (!(prop in newProps)) {
      patchProp(el, prop, oldProps[prop], null, self);
    }
  }

  for (const prop in newProps) {
    const next = newProps[prop];
    const prev = oldProps[prop];
    if (next !== prev) {
      patchProp(el, prop, prev, next, self);
    }
  }

  // 3. Children (naive, no key-based reconciliation)
  const oldChildren = self.children;
  const newChildren = newVnode.children;
  const oldLen = oldChildren.length;
  const newLen = newChildren.length;

  for (let i = 0; i < Math.min(oldLen, newLen); i++) {
    self.children[i] = patch(oldChildren[i], newChildren[i]);
  }

  if (oldLen < newLen) {
    for (let i = oldLen; i < newLen; i++) {
      const newChildL = L(newChildren[i]);
      self.children.push(newChildL);
      mount(newChildL, el);
    }
  } else {
    for (let i = newLen; i < oldLen; i++) {
      unmount(oldChildren[i]);
    }
    self.children.length = newLen;
  }

  self.vnode = newVnode;

  return self;
}

// Subscribe self to a signal and rerender on change. Auto-unsubscribes on unmount.
export function bindSignal(self, sig) {
  const unsub = sig.subscribe(() => {
    patch(self, self.vnode);
  });
  (self.hooks.onUnmount ||= []).push(unsub);
}
