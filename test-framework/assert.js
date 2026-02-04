function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function assertEqual(a, b, msg) {
  assert(a === b, msg);
}

function assertNotEqual(a, b, msg) {
  assert(a !== b, msg);
}

// Does not work on self-referencing objects
function assertDeepEqual(a, b, msg) {
  if (a === b) return;
  assertEqual(typeof a, typeof b, msg);
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    assertEqual(keysA.length, keysB.length, msg);
    for (const key of keysA) {
      assertDeepEqual(a[key], b[key], msg);
    }
    return;
  }
  assertEqual(a, b, msg);
}

function assertType(val, type, msg) {
  assert(typeof val === type, msg || `Expected value ${val} to have type ${type}`);
}

function assertInstance(val, cls, msg) {
  assert(val instanceof cls, msg || `Expected value ${val} to be instance of class ${cls}`);
}

function assertDefined(val, msg) {
  assert(val !== undefined, msg || `Expected value to be defined`);
}

function assertTruthy(val, msg) {
  assert(Boolean(val), msg || `Expected value ${val} to be truthy`);
}

function assertFalsy(val, msg) {
  assert(!Boolean(val), msg || `Expected value ${val} to be falsy`);
}

function assertThrows(fn, expectedError, msg) {
  var errorFound = false;
  try {
    fn();
  }
  catch (err) {
    errorFound = true;
    if (expectedError instanceof RegExp) {
      assert(expectedError.test(err.message), msg || `Expected error message to match ${expectedError}, got "${err.message}"`);
    }
    else if (typeof expectedError === "string") {
      assert(err.message.includes(expectedError), msg || `Expected error message to include "${expectedError}", got "${err.message}"`);
    }
    else if (expectedError instanceof Error) {
      assert(err.name === expectedError.name, msg || `Expected ${expectedError.name}, got ${err.name}`);
    }
    else if (expectedError) {
      assert(false, "Invalid expectedError type");
    }
  }
  assert(errorFound, msg || `Expected function to throw error`);
}

function assertDoesNotThrow(fn, msg) {
  var errorFound = false;
  try {
    fn();
  }
  catch (error) {
    errorFound = true;
  }
  assert(!errorFound, msg || `Expected function to execute without error`);
}

export {
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
  assertDoesNotThrow,
};
