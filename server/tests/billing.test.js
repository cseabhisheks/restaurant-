const test = require('node:test');
const assert = require('node:assert/strict');
const { computeBill, canTransition } = require('../src/utils/billing');

const lines = [{ name: 'A', price: 100, quantity: 2 }, { name: 'B', price: 49.99, quantity: 3 }];

test('subtotal, tax and total with no discount', () => {
  const b = computeBill({ lines, taxRate: 5 });
  assert.equal(b.subtotal, 349.97);
  assert.equal(b.taxAmount, 17.5);
  assert.equal(b.total, 367.47);
});
test('percent discount applies before tax', () => {
  const b = computeBill({ lines: [{ name: 'A', price: 200, quantity: 1 }], taxRate: 5, discountType: 'percent', discountValue: 10 });
  assert.equal(b.discountAmount, 20); assert.equal(b.taxAmount, 9); assert.equal(b.total, 189);
});
test('flat discount is capped at subtotal', () => {
  const b = computeBill({ lines: [{ name: 'A', price: 50, quantity: 1 }], taxRate: 5, discountType: 'flat', discountValue: 500 });
  assert.equal(b.total, 0);
});
test('totals recalculate when quantity changes', () => {
  const one = computeBill({ lines: [{ name: 'A', price: 100, quantity: 1 }], taxRate: 10 });
  const two = computeBill({ lines: [{ name: 'A', price: 100, quantity: 2 }], taxRate: 10 });
  assert.equal(one.total, 110); assert.equal(two.total, 220);
});
test('status workflow only moves forward', () => {
  assert.ok(canTransition('Pending', 'Preparing'));
  assert.ok(canTransition('Ready', 'Completed'));
  assert.ok(!canTransition('Pending', 'Completed'));
  assert.ok(!canTransition('Completed', 'Pending'));
  assert.ok(!canTransition('Cancelled', 'Pending'));
});
