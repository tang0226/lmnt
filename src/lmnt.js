const propAliases = {
  'class': 'className',
  'for': 'htmlFor',
};

// virtual node creator
// children are other vnodes, strings, or numbers
export function V(type, props = {}, ...children) {
  // Treat `props` as another child if applicable
  if (
    props.type || // vnode
    typeof props === 'string' ||
    typeof props === 'number' ||
    Array.isArray(props)
  ) {
    children.unshift(props);
    props = {};
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
    props,
    children: childList,
    _onCreate: props.onCreate,
  };
}

// Returns a new object that contains a newly created DOM element
export function L(vnode) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return { el: document.createTextNode(vnode) };
  }

  const el = document.createElement(vnode.type);
  const props = vnode.props;

  // Props
  var _onMount, _onUnmount;
  var events = {};
  for (const prop of Object.keys(props)) {
    const val = props[prop];

    // Basic lifecycle functions
    if (prop === 'onMount') {
      _onMount = val;
    }
    else if (prop === 'onUnmount') {
      _onUnmount = val;
    }
    // Event listeners
    else if (prop.startsWith("on") && prop[2] === prop[2].toUpperCase()) {
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

  // Children
  const children = [];
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

  var self = { el, children, _onMount, _onUnmount };
  
  // onCreate lifecycle
  if (typeof vnode._onCreate === 'function') {
    vnode._onCreate(self);
  }

  // Pass self as context to event listeners, since they are often defined
  // in V (on the vnode level, not the DOM element (L) level)
  for (const eName of Object.keys(events)) {
    self.el.addEventListener(eName, (e) => {
      events[eName](e, self);
    });
  }

  return self;
}


function runOnmountCallbacks(elObj) {
  // Run parent's onMount first
  elObj._onMount?.(elObj);
  for (const child of elObj.children || []) {
    runOnmountCallbacks(child);
  }
}

export function mount(elObj, container) {
  container.appendChild(elObj.el);
  runOnmountCallbacks(elObj);
}

function runOnunmountCallbacks(elObj) {
  // Run children's onUnmount first
  for (const child of elObj.children || []) {
    runOnunmountCallbacks(child);
  }
  elObj._onUnmount?.(elObj);
}

export function unmount(elObj) {
  runOnunmountCallbacks(elObj);
  elObj.el.remove();
}
