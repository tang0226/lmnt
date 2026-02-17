const propAliases = {
  'class': 'className',
  'for': 'htmlFor',
};

function normalizeChild(child) {
  if (child instanceof Node) {
    return { el: child };
  }

  if (typeof child === 'string' || typeof child === 'number') {
    return { el: document.createTextNode(child) };
  }

  // already an elObj
  return child;
}

function normalizeChildren(children) {
  const childList = [];
  for (const child of children) {
    if (Array.isArray(child)) {
      for (const c of child) {
        childList.push(normalizeChild(c));
      }
      continue;
    }
    childList.push(normalizeChild(child));
  }

  return childList;
}

export function L(tag, props = {}, ...children) {

  // Treat props like an element / text node if applicable
  if (
    props.el instanceof Node ||
    props instanceof Node ||
    typeof props == 'string' ||
    typeof props == 'number' ||
    Array.isArray(props)
  ) {
    children.unshift(props);
    props = {};
  }
  
  const el = document.createElement(tag);
  var _onMount, _onUnmount;

  for (const prop of Object.keys(props)) {
    const val = props[prop];

    // Basic lifecycle functions
    if (prop == 'onMount') {
      _onMount = val;
    }
    else if (prop == 'onUnmount') {
      _onUnmount = val;

    }
    // Event listeners
    else if (prop.startsWith("on") && prop[2] === prop[2].toUpperCase()) {
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

  children = normalizeChildren(children);
  for (const child of children) {
    el.appendChild(child.el);
  }

  return { tag, el, children, _onMount, _onUnmount };
}


function runOnmountCallbacks(elObj) {
  // Run parent's onMount first
  elObj._onMount?.();
  for (const child of elObj.children || []) {
    runOnmountCallbacks(child);
  }
}

export function mount(elObj, container) {
  container.appendChild(elObj.el);
  runOnmountCallbacks(elObj);
}

function runOnunmountCallbacks(elObj) {
  // Run childrens' onUnmouns first
  for (const child of elObj.children || []) {
    runOnunmountCallbacks(child);
  }
  elObj._onUnmount?.();
}

export function unmount(elObj) {
  runOnunmountCallbacks(elObj);
  elObj.el.remove();
}
