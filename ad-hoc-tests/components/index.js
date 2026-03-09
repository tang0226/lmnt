import { V, L, mount, unmount } from '../../src/lmnt.js';

function Wrapper({ children, ...props }) {
  return V('div',
    {
      style: { padding: '10px', background: 'lightgray' },
      $onCreate: (self) => { console.log('Wrapper created') },
      $onMount: (self) => { console.log('Wrapper mounted') },
      $onUnmount: (self) => { console.log('Wrapper unmounted') },
      ...props
    },
    children
  );
}

function InnerWrapper({ children }) {
  return V(MostInnerWrapper,
    {
      style: { color: 'brown' },
      $onCreate: (self) => { console.log('InnerWrapper created') },
      $onMount: (self) => { console.log('InnerWrapper mounted') },
      $onUnmount: (self) => { console.log('InnerWrapper unmounted') },
    },
    children,
    V('div', 'extra child passed to MostInnerWrapper from InnerWrapper'),
  );
}
function MostInnerWrapper({ children }) {
  return V('div',
    {
      $onCreate: (self) => { console.log('MostInnerWrapper created') },
      $onMount: (self) => { console.log('MostInnerWrapper mounted') },
      $onUnmount: (self) => { console.log('MostInnerWrapper unmounted') },
    },
    V('p', 'test paragraph inside MostInnerWrapper'),
    V('div', 'Begin MostInnerWrapper children:'),
    children,
    V('div', 'end MostInnerWrapper children'),
  );
}

var vnode = V(Wrapper,
  {
    onClick: (e, self) => { unmount(self) },
  },
  V(InnerWrapper,
    V('div',
      V('span', 'test ', V('b', 'bold'), ' and ', V('i', 'italics')),
    ),
  ),
  V('p', 'test paragraph'),
);

var elObj = L(vnode);

// All lifecycle functions triggered by `mount` and `unmount` should execute inside-first (bottom-up)
mount(elObj, document.body);
console.log("Mounting done. Unmounting element...");
unmount(elObj, document.body);