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

testSuite.addTest('Multiple children passed in array', () => {
  var el = L('div', [L('span'), L('p'), L('div')]);
  assertEqual(el.el.outerHTML, '<div><span></span><p></p><div></div></div>');
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

testSuite.addTest('Style attribute from object (hyphenated props)', () => {
  var el = L('div', { style: { 'background-color': 'red', 'font-family': 'sans-serif'} });
  assertEqual(el.el.style.backgroundColor, 'red');
  assertEqual(el.el.style.fontFamily, 'sans-serif');
});

testSuite.addTest('Style attribute from object (camelCase props)', () => {
  var el = L('div', { style: { backgroundColor: 'red', fontFamily: 'sans-serif'} });
  assertEqual(el.el.style.backgroundColor, 'red');
  assertEqual(el.el.style.fontFamily, 'sans-serif');
});

testSuite.addTest('onMount initializes', () => {
  var el = L('div', { onMount: () => {} });
  assertTruthy(el._onMount);
});

testSuite.addTest('onUnmount initializes', () => {
  var el = L('div', { onUnmount: () => {} });
  assertTruthy(el._onUnmount);
});

testSuite.addTest('className prop recognized', () => {
  var el = L('div', { id: 'test-div', className: 'test-class test-class-2' }, "test text");
  assertTruthy(el.el.classList.contains('test-class'));
  assertTruthy(el.el.classList.contains('test-class-2'));
});

testSuite.addTest('class -> className alias', () => {
  var el = L('div', { id: 'test-div', class: 'test-class test-class-2' }, "test text");
  assertTruthy(el.el.classList.contains('test-class'));
  assertTruthy(el.el.classList.contains('test-class-2'));
});

testSuite.addTest('htmlFor prop recognized', () => {
  var el = L('label', { htmlFor: 'test' }, "test text");
  assertEqual(el.el.htmlFor, 'test');
});

testSuite.addTest('for -> htmlFor alias', () => {
  var el = L('label', { for: 'test' }, "test text");
  assertEqual(el.el.htmlFor, 'test');
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

testSuite.runTests();


var { el } = L('div', { style: { 'color': 'red' } },
  'Here, have some...',
  document.createElement("hr"),
  L('i', 'italic text!'),
);

document.body.appendChild(el);
