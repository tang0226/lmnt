const propAliases = {
  'class': 'className',
  'for': 'htmlFor',
};

export function L(tag, props = {}, ...children) {

  // Treat props like an element / text node if applicable
  if (props.el instanceof Node || props instanceof Node || typeof props == 'string') {
    children.unshift(props);
    props = {};
  }
  
  const el = document.createElement(tag);
  var _onMount, _onUnmount, _useLifecycle = false;

  for (const prop of Object.keys(props)) {
    const val = props[prop];

    // Basic lifecycle functions
    if (prop == 'onMount') {
      _onMount = val;
      _useLifecycle = true;
    }
    else if (prop == 'onUnmount') {
      _onUnmount = val;
      _useLifecycle = true;
    }
    // Event listeners
    else if (/^on.+/.test(prop)) {
      el.addEventListener(prop.slice(2).toLowerCase(), val);
    }
    // Style
    else if (prop == 'style') {
      if (typeof val == 'object') {
        for (const cssProp of Object.keys(val)) {
          el.style[cssProp] = val[cssProp];
        }
      }
      if (typeof val == 'string') {
        el.style = val;
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

  for (const child of children) {
    if (child instanceof Node) {
      el.appendChild(child);
    }
    else if (typeof child == 'object') {
      if (child._useLifecycle) {
        _useLifecycle = true;
      }
      el.appendChild(child.el);
    }
    else {
      el.appendChild(document.createTextNode(child));
    }
  }

  return { tag, el, children, _useLifecycle, _onMount, _onUnmount };
}


function runOnmountCallbacks(elObj) {
  // Run parent's onMount first
  elObj._onMount?.();
  for (const child of elObj.children) {
    if (child._useLifecycle) {
      runOnmountCallbacks(child);
    }
  }
}

export function mount(elObj, container) {
  container.appendChild(elObj.el);
  runOnmountCallbacks(elObj);
}

function runOnunmountCallbacks(elObj) {
  // Run childrens' onUnmouns first
  for (const child of elObj.children) {
    if (child._useLifecycle) {
      runOnunmountCallbacks(child);
    }
  }
  elObj._onUnmount?.();
}

export function unmount(elObj) {
  runOnunmountCallbacks(elObj);
  elObj.el.remove();
}
