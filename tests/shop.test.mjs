import test from 'node:test';
import assert from 'node:assert/strict';
import { products, MAX_CART_QUANTITY } from '../src/shop-data.js';
import { normalizeCart, cartSummary, formatShopPrice, buildOrderMessage, orderWhatsAppUrl, selectProducts } from '../src/shop.js';

test('cart totals use integer cents across products and quantities', () => {
  const summary = cartSummary([{ id: 'pomada-matte', quantity: 2 }, { id: 'escova', quantity: 3 }]);
  assert.equal(summary.totalCents, 18950);
  assert.equal(summary.quantity, 5);
  assert.equal(summary.items[0].subtotalCents, 9980);
  assert.match(formatShopPrice(summary.totalCents), /189,50/);
});

test('malformed storage values and unknown product ids cannot enter the cart', () => {
  for (const raw of [null, {}, '[]', 1, undefined]) assert.deepEqual(normalizeCart(raw), []);
  assert.deepEqual(normalizeCart([null, false, {}, { id: '__proto__', quantity: 1 }, { id: 'missing', quantity: 1 }]), []);
});

test('cart rejects noninteger, zero, negative, unsafe and coerced quantities', () => {
  const raw = [0, -1, 1.5, '2', null, true, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map((quantity) => ({ id: 'gel', quantity }));
  assert.deepEqual(normalizeCart(raw), []);
});

test('duplicate entries merge and are capped at the advertised quantity limit', () => {
  assert.deepEqual(normalizeCart([{ id: 'gel', quantity: 12 }, { id: 'gel', quantity: 12 }, { id: 'tesoura', quantity: 999 }]), [{ id: 'gel', quantity: MAX_CART_QUANTITY }, { id: 'tesoura', quantity: MAX_CART_QUANTITY }]);
});

test('normalized storage contains ids and quantities without trusting injected prices or personal data', () => {
  assert.deepEqual(normalizeCart([{ id: 'oleo-barba', quantity: 1, priceCents: 1, name: 'Injected', phone: 'secret' }]), [{ id: 'oleo-barba', quantity: 1 }]);
  assert.equal(cartSummary([{ id: 'oleo-barba', quantity: 1, priceCents: 1 }]).totalCents, 3990);
});

test('empty cart has no order message or external checkout URL', () => {
  assert.deepEqual(cartSummary([]), { items: [], quantity: 0, totalCents: 0 });
  assert.equal(buildOrderMessage([]), '');
  assert.equal(orderWhatsAppUrl([{ id: 'fake', quantity: 1 }]), '');
});

test('WhatsApp order lists quantities, unit prices, line totals and confirmation conditions', () => {
  const cart = [{ id: 'gel', quantity: 2 }, { id: 'navalha', quantity: 1 }];
  const message = buildOrderMessage(cart);
  assert.match(message, /2 × Gel de cabelo \(250 g\)/);
  assert.match(message, /34,90 cada = R\$\s69,80/);
  assert.match(message, /114,70/);
  assert.match(message, /frete não incluído/);
  assert.match(message, /catálogo demonstrativo/);
  assert.match(message, /depende da confirmação/);
  const url = new URL(orderWhatsAppUrl(cart));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/5511927260440');
  assert.equal(url.searchParams.get('text'), message);
});

test('search ignores accents and case while combining category filters', () => {
  assert.deepEqual(selectProducts({ search: 'OLEO' }).map((p) => p.id), ['oleo-barba']);
  assert.deepEqual(selectProducts({ category: 'ferramentas', search: 'tesoura' }).map((p) => p.id), ['tesoura']);
  assert.deepEqual(selectProducts({ category: 'cuidados', search: 'tesoura' }), []);
  assert.equal(selectProducts({ search: '   ' }).length, products.length);
});

test('sort produces stable price order without mutating catalogue', () => {
  const original = products.map((p) => p.id);
  const ascending = selectProducts({ sort: 'price-asc' });
  assert.equal(ascending[0].id, 'escova');
  assert.equal(ascending.at(-1).id, 'maquina');
  assert.equal(selectProducts({ sort: 'price-desc' })[0].id, 'maquina');
  assert.deepEqual(products.map((p) => p.id), original);
});

test('each illustrative product is priced in positive integer cents and has unique identity', () => {
  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  assert.ok(products.every((p) => Number.isSafeInteger(p.priceCents) && p.priceCents > 0));
});
