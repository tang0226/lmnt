import { V, L, mount, unmount } from '../../src/lmnt.js';
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
  return V('div',
    {
      onCreate(self) {
        const div = self.el.querySelector('#counter-val');
        withRender(self, store, {
          select: (s) => s.val,
          render: (next, prev, action) => { div.innerText = next },
        });
      }
    },
    V('div', { id: 'counter-val' }, store.getState().val.toString()),
    V('button', { onClick: () => { store.dispatch({ type: 'incr' }) } }, '+'),
    V('button', { onClick: () => { store.dispatch({ type: 'decr' }) } }, '-'),
  );
}

function MetaCounter(store) {
  return V('div',
    {
      onCreate(self) {
        const div = self.el.querySelector('#incr-val');
        withRender(self, store, {
          select: (s) => s.incr,
          render: (next, prev, action) => { div.innerText = next },
        });
      }
    },
    V('div', { id: 'incr-val' }, store.getState().incr.toString()),
    V('button', { onClick: () => { store.dispatch({ type: 'incr-incr' }) } }, '+'),
    V('button', { onClick: () => { store.dispatch({ type: 'decr-incr' }) } }, '-'),
  );
}

mount(L(V('div', Counter(st), MetaCounter(st))), document.body);
