import { V, L, mount, unmount } from '../../src/lmnt.js';

function Counter(init = 0) {
  var count = init;
  
  var v = V('button', {
    onClick: (e, self) => {
      count++;
      render(self);
    },
    onMount: (self) => {
      console.log(self.el.clientWidth);
    },
    style: 'display: block',
  }, count);

  
  function render(self) {
    self.el.innerText = count;
  }
  
  return v;
}

function Canvas() {
  var ctx;
  var v = V('canvas', {
    width: 400,
    height: 400,
    style: 'border: 1px solid black',
    onMount: (self) => {
      ctx = self.el.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(10, 10, 50, 50);
      console.log('canvas mounted');
    },
    onMouseDown: (e, self) => {
      ctx.fillRect(e.offsetX, e.offsetY, 10, 10);
    },
  });

  return v;
}

function GoAway(content) {
  var v = V('div', {
    onMount: (self) => { console.log(content + ' mounted') },
    onClick: (e, self) => { unmount(self) },
    onUnmount: (self) => { console.log(content + ' unmounted') },
  }, content);
  return v;
}

function GoAwayNested(content1, content2) {
  var v = V(
    'div',
    {
      onMount: () => { console.log(content1 + ' mounted') },
      onClick: (e, self) => { unmount(self) },
      onUnmount: () => { console.log(content1 + ' unmounted') },
    },
    content1,
    V(
      'span',
      {
        onMount: () => { console.log(`${content1}:${content2} mounted`) },
        onUnmount: () => { console.log(`${content1}:${content2} unmounted`) },
      },
      ' ' + content2
    )
  );
  return v;
}

var a = L(V('div', { style: { 'background': '#EEE', 'font-family': 'sans-serif' }},
  V('p', 'test paragraph.'),
  V('hr'),
  
  // p with style and text nodes
  V('p', { style: 'font-size: 40px; font-family: Georgia' },
    V('i', 'italic text '),
    'and ',
    V('b', 'bold text')
  ),

  // testing a component render function
  V('button', { onClick: () => alert('hello world!') }, 'Hallo'),
  [1,2,3].map((n) => V('div', n.toString())),

  V('div', {}, 'counter function'),
  Counter(),
  Canvas(),
  [1,2,3,4,5].map((n) => GoAway(n)),
  GoAwayNested('outer', 'inner'),
  V('div', { onMount: () => { console.log("div mounted")} }),
));

console.log(a);

mount(a, document.body);
