export function L(tag, props = {}, ...children) {

  // Treat props like an element / text node if applicable
  if (props.el instanceof Node || props instanceof Node || typeof props == 'string') {
    children.unshift(props);
    props = {};
  }
  
  const el = document.createElement(tag);
  var onMount, onUnmount, useLifecycle = false;

  for (const prop of Object.keys(props)) {
    const val = props[prop];
    switch (prop) {
      case 'style':
        if (typeof val == 'object') {
          for (const cssProp of Object.keys(val)) {
            el.style[cssProp] = val[cssProp];
          }
        }
        if (typeof val == 'string') {
          el.style = val;
        }
        break;
      
      // component props
      case 'onMount':
      case 'onmount':
        onMount = val;
        useLifecycle = true;
        break;
      case 'onUnmount':
      case 'onunmount':
        onUnmount = val;
        useLifecycle = true;
        break;

      // special-case HTML props
      case 'class':
        el.className = val;
        break;
      case 'for':
        el.htmlFor = val;
        break;

      default:
        el[prop] = val;
    }
  }

  for (const child of children) {
    if (child instanceof Node) {
      el.appendChild(child);
    }
    else if (typeof child == 'object') {
      if (child.useLifecycle) {
        useLifecycle = true;
      }
      el.appendChild(child.el);
    }
    else {
      el.appendChild(document.createTextNode(child));
    }
  }

  return { el, children, useLifecycle, onMount, onUnmount };
}


function runOnmountCallbacks(elObj) {
  // Run parent's onMount first
  elObj.onMount?.();
  for (const child of elObj.children) {
    if (child.useLifecycle) {
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
    if (child.useLifecycle) {
      runOnunmountCallbacks(child);
    }
  }
  elObj.onUnmount?.();
}

export function unmount(elObj) {
  runOnunmountCallbacks(elObj);
  elObj.el.remove();
}
