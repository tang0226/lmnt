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

export function V(type, props = {}, ...children) {
  // Treat primitive or v-node props as a child
  if (
    props._isVnode ||
    isPrimitive(props) ||
    Array.isArray(props)
  ) {
    children.unshift(props);
    props = {};
  }

  // Split props into key, lifecycle hooks, and regular props
  let key = null;
  const hooks = {};
  const cleanProps = {};
  for (const [prop, val] of Object.entries(props)) {
    if (prop === 'key') {
      key = val;
    } else if (prop[0] === '$') {
      hooks[prop.slice(1)] = [val];
    } else if (prop.startsWith('on')) {
      cleanProps[prop.toLowerCase()] = val;
    } else {
      cleanProps[prop] = val;
    }
  }

  // Linearize children, since arrays are excepted
  const childArray = [];
  for (const child of children) {
    if (Array.isArray(child)) {
      for (const c of child) {
        childArray.push(c);
      }
    } else {
      childArray.push(child);
    }
  }

  return {
    type,
    key,
    props: cleanProps,
    hooks,
    children: childArray,
    _isVnode: true,
  }
}

export function L(vnode) {
  // Create text nodes from primitives
  if (isPrimitive(vnode)) {
    return {
      el: document.createTextNode(vnode),
      vnode,
    }
  }

  const self = { vnode };

  if (typeof vnode.type === 'function') {
  // Component
    let res = vnode.type({ ...vnode.props, children: vnode.children });
    if (typeof res === 'function') {
      self.render = res;
      self.childL = L(res({ ...vnode.props, children: vnode.children }));
    } else {
      self.render = vnode.type;
      self.childL = L(res);
    }

    self.el = self.childL.el;
  } else {
  // Tag
    self.el = document.createElement(vnode.type);
    self.children = [];

    // Props
    for (const prop in vnode.props) {
      patchProp(self.el, prop, null, vnode.props[prop], self);
    }

    // Children
    vnode.children.forEach(child => {
      const childL = L(child);
      self.children.push(childL);
      self.el.appendChild(childL.el);
    });

    // Events
    self.handleEvent = (e) => {
      const type = e.type;
      const handler = self.vnode.props['on' + type];
      if (handler) {
        handler(e, self);
      }
    }
  }

  // Update function (patches self with new props)
  self.update = (props) => {
    if (self.render) {
      patch(self, { ...self.vnode, props });
    }
  };

  // Deep copy hook arrays
  self.hooks = Object.fromEntries(Object.entries(vnode.hooks).map(([key, val]) => [key, [...val]]));

  // Run onCreate lifecycle after all elements are created
  vnode.hooks.onCreate?.forEach(fn => { fn(self) });

  return self;
}

function runMountLifecycle(self) {
  // Run children's onMount first (bottom-up)
  for (const child of self.children || (self.childL ? [self.childL] : [])) {
    runMountLifecycle(child);
  }
  self.hooks?.onMount?.forEach(fn => { fn(self) });
}

export function mount(self, container) {
  container.appendChild(self.el);
  runMountLifecycle(self);
}

function runUnmountLifecycle(self) {
  // Run children's onUnmount first (bottom-up)
  for (const child of self.children || (self.childL ? [self.childL] : [])) {
    runUnmountLifecycle(child);
  }
  self.hooks?.onUnmount?.forEach(fn => { fn(self) });
}

export function unmount(self) {
  runUnmountLifecycle(self);
  self.el.remove();
}

function patchProp(el, prop, prev, next, self) {
  if (prop.startsWith('on')) {
    const eName = prop.slice(2).toLowerCase();
    if (!prev && next) {
      el.addEventListener(eName, self);
    } else if (prev && !next) {
      el.removeEventListener(eName, self);
    }
  } else if (prop === 'style') {
    if (typeof next === 'string') {
      el.style.cssText = next;
    } else if (next && typeof next === 'object') {
      if (typeof prev === 'object' && prev) {
        for (const cssP in prev) {
          if (!(cssP in next)) {
            el.style[cssP] = '';
          }
        }
      } else if (prev) {
        // prev was a string - clear all styles
        el.style.cssText = '';
      }

      // Apply style from next v-node
      for (const [prop, val] of Object.entries(next)) {
        el.style[prop] = val;
      }
    } else {
      // no next value; clear styles
      el.style.cssText = '';
    }
  } else {
    const attr = propAliases[prop] || prop;
    prop = attrAliases[attr] || prop;
    if (next == null) {
      el.removeAttribute(attr);
    } else if (prop in el) {
      if (el[prop] !== next) {
        el[prop] = next;
      }
    } else {
      el.setAttribute(attr, next);
    }
  }
}

export function patch(self, newVnode) {
  const { el } = self;

  // Text ↔ text: update nodeValue in place
  if (isPrimitive(self.vnode)) {
    if (isPrimitive(newVnode)) {
      if (newVnode !== self.vnode) {
        el.nodeValue = String(newVnode);
        self.vnode = newVnode;
      }
      return self;
    }
    // text → element: full replace (text nodes have no hooks, skip unmount)
    const newSelf = L(newVnode);
    el.replaceWith(newSelf.el);
    runMountLifecycle(newSelf);
    return newSelf;
  }

  // element → text: full replace (text nodes have no hooks, skip mount lifecycle)
  if (isPrimitive(newVnode)) {
    const newSelf = L(newVnode);
    el.replaceWith(newSelf.el);
    unmount(self);
    return newSelf;
  }

  // Different component type = full replace
  if (self.vnode.type !== newVnode.type) {
    const newSelf = L(newVnode);
    el.replaceWith(newSelf.el);
    unmount(self);
    runMountLifecycle(newSelf);
    return newSelf;
  }
  
  if (self.render) {
    const innerVnode = self.render({ ...newVnode.props, children: newVnode.children });
    self.childL = patch(self.childL, innerVnode);
    self.el = self.childL.el;
    self.vnode = newVnode;
    return self;
  }

  // Props
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


  // Children (key-based diffing/patching)
  const keyedOld = new Map();
  const unkeyedOld = [];
  for (const oldL of self.children) {
    const k = isPrimitive(oldL.vnode) ? null : oldL.vnode.key;
    if (k !== null) {
      keyedOld.set(k, oldL);
    } else {
      unkeyedOld.push(oldL);
    }
  }

  // Reconcile new children left-to-right
  const newChildren = [];
  const newNodes = []; // freshly created L-nodes that need mount lifecycle
  let unkeyedI = 0;
  for (const newV of newVnode.children) {
    const k = isPrimitive(newV) ? null : newV.key;

    if (k !== null) { // keyed
      let oldL = keyedOld.get(k);
      if (oldL !== undefined) { // key matches
        keyedOld.delete(k);
        newChildren.push(patch(oldL, newV));
      } else { // key doesn't match; add newV as new element
        const newL = L(newV);
        newNodes.push(newL);
        newChildren.push(newL);
      }
    } else { // unkeyed: consume positionally
      const oldL = unkeyedOld[unkeyedI++];
      if (oldL) {
        newChildren.push(patch(oldL, newV));
      } else {
        const newL = L(newV);
        newNodes.push(newL);
        newChildren.push(newL);
      }
    }
  }

  // Remove old nodes
  for (const oldL of keyedOld.values()) {
    unmount(oldL);
  }
  for (let i = unkeyedI; i < unkeyedOld.length; i++) {
    unmount(unkeyedOld[i]);
  }

  // Reorder DOM
  let nextSibling = null;
  for (let i = newChildren.length - 1; i >= 0; i--) {
    const child = newChildren[i];
    if (child.el.parentNode !== el || child.el.nextSibling !== nextSibling) {
      el.insertBefore(child.el, nextSibling);
    }
    nextSibling = child.el;
  }

  // Run mount lifecycle on new nodes
  newNodes.forEach((node) => runMountLifecycle(node));

  self.vnode = newVnode;
  self.children = newChildren;

  return self;
}

// Subscribe self to a signal and rerender on change. Auto-unsubscribes on unmount.
export function bindSignal(self, sig) {
  const unsub = sig.subscribe(() => self.update());
  (self.hooks.onUnmount ||= []).push(unsub);
}

// Subscribe self to a store and rerender when selected state changes. Auto-unsubscribes on unmount.
export function bindStore(self, store, {
  select = s => s,
  shouldUpdate = (next, prev) => !Object.is(next, prev),
} = {}) {
  let prev = select(store.getState());

  const unsub = store.subscribe((state) => {
    const next = select(state);
    if (shouldUpdate(next, prev)) {
      prev = next;
      self.update();
    }
  });

  (self.hooks.onUnmount ||= []).push(unsub);
}
