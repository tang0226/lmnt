# LMNT:
A tiny Javascript framework inspired by and modeled after React and Redux.
One of my attempts to build a scalable UI framework from scratch in vanilla JS.

To import:
```javascript
// L, mount, unmount
import { L, mount, unmount } from '<path-to-lmnt>/src/lmnt.js';
// createStore
import { createStore } from '<path-to-lmnt>/src/store.js';
```

## Guide:
### `L(tag, [props], ...children)`
Shorthand imitation of [`React.createElement()`](https://react.dev/reference/react/createElement)
Children can be text, HTML elements, or another `L` call.
`L` returns an object that contains the HTML element, references to the element's children, and `onMount` or `onUnmount` events passed as element props (see `mount()` and `unmount()`).

```javascript
var { el } = L('div', { style: { 'color': 'red' } },
  'Here, have some...',
  document.createElement('hr'),
  L('i', 'italic text!'),
);
```

### `mount(elObj, container)`
`mount` appends an element as a child to a container and executes `onMount` lifecycle functions.
`elObj`: An element object returned by `L()`. `mount()` will execute any `onMount` props attached to the object or any of its child element objects.

```javascript
var hasMounted = false;
mount(
  L('div', { onMount() {hasMounted = true} }),
  document.createElement('div')
);
console.log(hasMounted); // true
```

### `unmount(elObj)`
`unmount` unmounts an element object, removing its HTML element from the DOM and executing `onUnmount` functions attached to the object and its children.

```javascript
var elToUnmount, hasUnmounted = false;
mount(
  elToUnmount = L('div', { onUnmount() { hasUnmounted = true } }),
  document.createElement('div')
);
unmount(elToUnmount);
console.log(hasUnmounted); // true
```