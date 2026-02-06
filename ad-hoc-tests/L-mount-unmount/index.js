import { L, mount, unmount } from '../../src/lmnt.js';

function Counter(init = 0) {
  var count = init;
  
  var self = L('button', {
    onClick: () => {
      count++;
      render();
    },
    onMount: () => {
      console.log(self.el.clientWidth);
    },
    style: 'display: block',
  }, count);

  
  function render() {
    self.el.innerText = count;
  }
  
  render();
  return self;
}

function Canvas() {
  var ctx;
  var self = L('canvas', {
    width: 400,
    height: 400,
    style: 'border: 1px solid black',
    onMount: () => {
      ctx = self.el.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(10, 10, 50, 50);
      console.log('canvas mounted')
    },
    onMouseDown: (e) => {
      ctx.fillRect(e.offsetX, e.offsetY, 10, 10);
    },
  });

  return self;
}

function GoAway(content) {
  var self = L('div', {
    onMount: () => { console.log(content + ' mounted') },
    onClick: () => { unmount(self) },
    onUnmount: () => { console.log(content + ' unmounted') },
  }, content);
  return self;
}

function GoAwayNested(content1, content2) {
  var self = L(
    'div',
    {
      onMount: () => { console.log(content1 + ' mounted') },
      onClick: () => { unmount(self) },
      onUnmount: () => { console.log(content1 + ' unmounted') },
    },
    content1,
    L(
      'span',
      {
        onMount: () => { console.log(`${content1}:${content2} mounted`) },
        onUnmount: () => { console.log(`${content1}:${content2} unmounted`) },
      },
      ' ' + content2
    )
  );
  return self;
}

var a;
mount(
  a = L('div', { style: { 'background': '#EEE', 'font-family': 'sans-serif' }},
    L('p', {}, 'test paragraph.'),
    L('hr'),
    
    // p with style and text nodes
    L('p', { style: 'font-size: 40px; font-family: Georgia' },
      L('i', 'italic text '),
      'and ',
      L('b', 'bold text')
    ),

    // testing a component render function
    L('button', { onClick: () => alert('hello world!') }, 'Hallo'),
    ...[1,2,3].map((n) => L('div', {}, n.toString())),

    L('div', {}, 'counter function'),
    Counter(),
    Canvas(),
    ...[1,2,3,4,5].map((n) => GoAway(n)),
    GoAwayNested('outer', 'inner'),
    L('div', { onMount: () => { console.log("div mounted")} }),
  ),
  document.body
);

console.log(a);
