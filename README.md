# LMNT:
A small vanilla JS framework modeled after React, Vue, and Redux.
One of my attempts to build a scalable frontend UI framework from scratch.

To import:
```javascript
import { V, L, mount, unmount } from '<path-to-lmnt>/src/lmnt.js';
// createStore for centralized state management
import { createStore } from '<path-to-lmnt>/src/store.js';
```

## Guide:
### `V(type, [props], ...children)`
Creates a new virtual node

Shorthand imitation of [`React.createElement()`](https://react.dev/reference/react/createElement)

`type`: can be either the tag name or a component function that receives props and/or children

`props`: the optional props parameter. Props can be:
* HTML attributes (e.g. `id`, `class`, `style`)
* event listeners (camel-cased names, e.g. `onClick`, `onLoad`)
* lifecycle hooks, prefixed with `$`: `$onCreate`, `$onMount`, `$onUnmount`

`children` can be an array of (arrays of) primitives or other v-nodes.

`V()` returns a v-node object that wraps the node type, props, and children in a single object

```javascript
var vnode = V('div',
  {
    style: { 'color': 'red' },
    $onMount: () => { console.log('mounted') },
  },
  'Top',
  V('hr'),
  V('span', { style: { 'background': 'lightgray' } }, 'bottom'),
);
console.log(vnode);
/**
{
  type: 'div',
  hooks: { onMount: () => { console.log('mounted') } },
  props: { style: { color: 'red' } },
  children: ['Top', vnodeObj, vnodeObj],
  _isVnode: true,
}
*/
```

### `L(vnode)`
Converts a v-node into an L-object containing the node's DOM element, children L-objects, hooks, and props.
Also executes `onCreate` hooks of the v-node and its descendants (bottom-up).

```javascript
var vnode = V('div',
  'With ',
  V('i', 'italic'),
  ' and ',
  V('b', 'bold'),
  ' text',
);
var elObj = L(vnode);
console.log(elObj);
/** 
{
  el: div (DOM element),
  events: {},
  hooks: {},
  props: {},
  children: [TextNode, elObj, TextNode, elObj, TextNode],
}
*/
```

### Hooks
Hooks are defined under a `V()` call, and they often need to reference a (future) L-object's DOM element via the `el` prop for manual rendering. To allow this, all hooks receive the relevant L-object as a parameter (often named `self`). Hooks execute starting from the bottom of the tree so that child L-objects are initialized / cleaned up before their parents.

`$onCreate`: called when a v-node is realized into an L-object using the `L` function

`$onMount`: called when `mount()` is called on an L-object

`$onUnmount`: called when `unmount()` is called on an L-object

### `mount(elObj, container)`
Appends the DOM element of an L-object as a child to a container, executing the `onMount` hooks of the L-object and its descendants (bottom-up).

`elObj`: An L-object returned by `L()`

```javascript
var hasMounted = false;
mount(
  L(V('div', { $onMount() { hasMounted = true } })),
  document.createElement('div'),
);
console.log(hasMounted); // true
```

### `unmount(elObj)`
Unmounts an L-object, removing the DOM element and executing the `onUnmount` hooks of the L-object and its descendants (bottom-up).

`elObj`: A previously-mounted L-object returned by `L()`

```javascript
var elObjToUnmount, hasUnmounted = false;
mount(
  elObjToUnmount = L(V('div', { $onUnmount() { hasUnmounted = true } })),
  document.createElement('div')
);
unmount(elObjToUnmount);
console.log(hasUnmounted); // true
```
