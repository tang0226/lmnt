export class TestSuite {
  constructor(name, tests = {}) {
    this.name = name;
    this.tests = [];
    for (const [name, func] of Object.entries(tests)) {
      this.tests.push({
        name: name,
        func: func,
      });
    }
  }

  addTest(name, func) {
    this.tests.push({
      name: name,
      func: func,
    });
  }

  runTests() {
    this.passed = 0;
    this.failed = 0;
    this.testCount = this.tests.length;
    this.failures = [];

    console.groupCollapsed(`Running test suite: ${this.name}`);

    for (const test of this.tests) {
      try {
        test.func();
        console.log(`✅ ${test.name}`);
        this.passed++;
      }
      catch (error) {
        let msg = `❌ ${test.name}:`
        console.log(msg);
        console.error(error);
        this.failures.push({ msg, error });
        this.failed++;
      }
    }

    console.groupEnd();

    if (this.passed == this.testCount) {
      console.log(`✅ all tests (${this.passed}/${this.testCount}) passed\n `);
      return true;
    }
    console.log(`⚠️ ${this.passed}/${this.testCount} tests passed; ${this.failed} failed\n `);
    return false;
  }
}
