import { L, mount, unmount } from '../../../src/lmnt.js';
import {
  assert,
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertType,
  assertInstance,
  assertDefined,
  assertTruthy,
  assertFalsy,
  assertThrows,
  assertDoesNotThrow
} from '../../test-framework/assert.js';
import { TestSuite } from '../../test-framework/test-suite.js';

const testSuite = new TestSuite('L');

testSuite.addTest('Single div with text', () => {
  var el = L('div', 'Hello world!');
  assertEqual(el.el.tagName, 'DIV');
});

testSuite.addTest('Nested L call', () => {
  var el = L('div', L('span', 'span text'));
  assertEqual(el.el.outerHTML, '<div><span>span text</span></div>')
});

testSuite.addTest('Empty div', () => {
  var el = L('div');
  assertEqual(el.el.outerHTML, '<div></div>')
});

testSuite.addTest('Style attribute from string', () => {
  var el = L('div', { style: 'background-color: red; font-family: sans-serif' });
  assertEqual(el.el.style['background-color'], 'red');
  assertEqual(el.el.style['font-family'], 'sans-serif');
});

testSuite.addTest('Style attribute from object', () => {
  var el = L('div', { style: { 'background-color': 'red', 'font-family': 'sans-serif'} });
  assertEqual(el.el.style['background-color'], 'red');
  assertEqual(el.el.style['font-family'], 'sans-serif');
});

testSuite.addTest('onMount initializes and sets appropriate flags', () => {
  var el = L('div', { onMount: () => {} });
  assertTruthy(el.onMount);
  assertTruthy(el.useLifecycle);
});

testSuite.addTest('onUnmount initializes and sets appropriate flags', () => {
  var el = L('div', { onUnmount: () => {} });
  assertTruthy(el.onUnmount);
  assertTruthy(el.useLifecycle);
});

testSuite.addTest('class -> className alias', () => {
  var el = L('div', { id: 'test-div', class: 'test-class test-class-2' }, "test text");
  assertTruthy(el.el.classList.contains('test-class'));
  assertTruthy(el.el.classList.contains('test-class-2'));
});

testSuite.addTest('Multiple nested children', () => {
  var el = L('div', { id: 'outer-div' },
    "Hello world!",
    L('br'),
    L('hr'),
    L('p',
      'Here is some ',
      L('b', 'bolded text '),
      'and some ',
      L('i', 'italic text'),
      '.'
    )
  );
  assertEqual(el.el.outerHTML, '<div id="outer-div">Hello world!<br><hr><p>Here is some <b>bolded text </b>and some <i>italic text</i>.</p></div>');
});

testSuite.addTest('Event on div', () => {
  var val = false;
  var el = L('div', { onclick: () => val = true });
  el.el.click();
  assertTruthy(val);
});

testSuite.addTest('', () => {
  var el = L();
});

testSuite.addTest('', () => {
  var el = L();
});

testSuite.runTests();


var { el } = L('div', { style: { 'color': 'red' } },
  'Here, have some...',
  document.createElement("hr"),
  L('i', 'italic text!'),
);

document.body.appendChild(el);


var hasMounted = false;
mount(
  L('div', { onMount() {hasMounted = true} }),
  document.createElement('div')
);
console.log(hasMounted); // true

var elToUnmount, hasUnmounted = false;
mount(
  elToUnmount = L('div', { onUnmount() { hasUnmounted = true } }),
  document.createElement('div')
);
unmount(elToUnmount);
console.log(hasUnmounted); // true