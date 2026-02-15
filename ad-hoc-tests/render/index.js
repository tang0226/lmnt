import { L, mount, unmount } from '../../src/lmnt.js';
import { createStore } from "../../src/store.js";
import { withRender } from "../../src/render.js";


const reducer = (state, action) => {
  switch(action.type) {
    case 'incr':
      return {...state, val: state.val + state.incr};
    case 'decr':
      return {...state, val: state.val - state.incr};
    case 'incr-incr':
      return {...state, incr: state.incr + 1};
    case 'decr-incr':
      return {...state, incr: state.incr - 1};
  }
  return state;
}

const st = createStore(reducer, { val: 0, incr: 1 });

function Counter(store) {

  var div = L('div', store.getState().val.toString());
  var incr = L('button', { onClick: () => { store.dispatch({ type: 'incr' }) } }, '+');
  var decr = L('button', { onClick: () => { store.dispatch({ type: 'decr' }) } }, '-');

  var self = L('div', div, incr, decr);

  withRender(self, store,
    {
      select: (s) => s.val,
      render: (next, prev, action) => { div.el.innerText = next },
    }
  );

  return self;
}

function MetaCounter(store) {
  var div = L('div', store.getState().incr.toString());
  var incr = L('button', { onClick: () => { store.dispatch({ type: 'incr-incr' }) } }, '+');
  var decr = L('button', { onClick: () => { store.dispatch({ type: 'decr-incr' }) } }, '-');

  var self = L('div', div, incr, decr);
  withRender(self, store,
    {
      select: (s) => s.incr,
      render: (next, prev, action) => { div.el.innerText = next },
    }
  );

  return self;
}

mount(L('div', Counter(st), MetaCounter(st)), document.body);
