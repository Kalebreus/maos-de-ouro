import { products, categories, MAX_CART_QUANTITY } from './shop-data.js';
import { contact } from './config.js';

export const CART_KEY = 'maos-de-ouro:cart:v1';
const productById = new Map(products.map((product) => [product.id, product]));
const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatShopPrice = (cents) => priceFormatter.format(cents / 100);

export function normalizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  const merged = new Map();
  for (const item of raw) {
    if (!item || typeof item !== 'object' || !productById.has(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    const quantity = Math.min(MAX_CART_QUANTITY, item.quantity + (merged.get(item.id) || 0));
    merged.set(item.id, quantity);
  }
  return [...merged].map(([id, quantity]) => ({ id, quantity }));
}

export function cartSummary(raw) {
  const items = normalizeCart(raw).map((item) => ({ ...item, product: productById.get(item.id), subtotalCents: productById.get(item.id).priceCents * item.quantity }));
  return { items, quantity: items.reduce((sum, item) => sum + item.quantity, 0), totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0) };
}

export function buildOrderMessage(raw) {
  const { items, totalCents } = cartSummary(raw);
  if (!items.length) return '';
  return [
    'Olá, Mãos de Ouro! Gostaria de consultar estes produtos:',
    '',
    ...items.map(({ product, quantity, subtotalCents }) => `${quantity} × ${product.name} (${product.unit}) — ${formatShopPrice(product.priceCents)} cada = ${formatShopPrice(subtotalCents)}`),
    '',
    `Total estimado: ${formatShopPrice(totalCents)} (frete não incluído).`,
    'Vim pelo catálogo demonstrativo. Podem confirmar os produtos, a disponibilidade, os valores finais, entrega ou retirada e formas de pagamento?',
    'Este resumo é uma consulta e depende da confirmação da barbearia.',
  ].join('\n');
}

export function orderWhatsAppUrl(raw) {
  const message = buildOrderMessage(raw);
  return message ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}` : '';
}

const searchable = (value) => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
export function selectProducts({ category = 'all', search = '', sort = 'featured' } = {}) {
  const query = searchable(search.trim());
  const selection = products.filter((product) => (category === 'all' || product.category === category) && (!query || searchable(`${product.name} ${product.description} ${product.categoryLabel}`).includes(query)));
  if (sort === 'price-asc') selection.sort((a, b) => a.priceCents - b.priceCents);
  if (sort === 'price-desc') selection.sort((a, b) => b.priceCents - a.priceCents);
  if (sort === 'name') selection.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return selection;
}

export function initShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const $ = (id) => document.getElementById(id);
  const detailDialog = $('product-dialog');
  const cartDialog = $('cart-dialog');
  const searchInput = $('shop-search');
  const sortInput = $('shop-sort');
  const status = $('cart-status');
  let cart = [];
  let category = 'all';
  let selectedProduct = null;
  let storageAvailable = true;
  let toastTimer;
  let returnTo;
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function notify(message) {
    const toast = $('shop-toast');
    clearTimeout(toastTimer);
    if (cartDialog.open) {
      toast.hidden = true;
      status.textContent = `${message}${storageAvailable ? '' : ' O carrinho está disponível apenas nesta página.'}`;
      return;
    }
    if (detailDialog.open) {
      toast.hidden = true;
      $('product-dialog-status').textContent = message;
      return;
    }
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4300);
  }
  function showStorageWarning() {
    storageAvailable = false;
    status.textContent = 'O navegador não permitiu salvar o carrinho. Suas escolhas ficam disponíveis apenas nesta página enquanto ela estiver aberta.';
  }
  function readCart() {
    let stored;
    try {
      stored = localStorage.getItem(CART_KEY);
    } catch { showStorageWarning(); return; }
    try {
      cart = normalizeCart(stored ? JSON.parse(stored) : []);
    } catch {
      cart = [];
      status.textContent = 'O carrinho anterior estava ilegível e foi reiniciado. Você pode escolher seus produtos novamente.';
      try { localStorage.removeItem(CART_KEY); } catch { showStorageWarning(); }
    }
  }
  function saveCart() {
    try {
      if (cart.length) localStorage.setItem(CART_KEY, JSON.stringify(cart));
      else localStorage.removeItem(CART_KEY);
    } catch { showStorageWarning(); }
  }
  function updateCart(nextCart, announcement) {
    cart = normalizeCart(nextCart);
    saveCart();
    renderCart();
    if (announcement) notify(announcement);
  }
  function addProduct(product, announce = true) {
    const existing = cart.find((item) => item.id === product.id);
    if (existing?.quantity === MAX_CART_QUANTITY) { notify(`O limite desta demonstração é ${MAX_CART_QUANTITY} unidades por produto.`); return false; }
    updateCart([...cart, { id: product.id, quantity: 1 }], announce ? `${product.name} adicionado ao carrinho.` : '');
    return true;
  }
  function closeCart() { cartDialog.close(); }
  function openCart(opener) {
    returnTo = opener || document.activeElement;
    if (detailDialog.open) detailDialog.close();
    renderCart();
    document.body.classList.add('shop-modal-open');
    cartDialog.showModal();
  }
  function openProduct(product, opener) {
    selectedProduct = product;
    returnTo = opener;
    const image = $('product-dialog-image'); image.src = product.image; image.alt = `Ilustração demonstrativa: ${product.name}`;
    $('product-dialog-category').textContent = product.categoryLabel;
    $('product-dialog-title').textContent = product.name;
    $('product-dialog-description').textContent = product.description;
    $('product-dialog-status').textContent = '';
    $('product-dialog-price').textContent = formatShopPrice(product.priceCents);
    $('product-dialog-unit').textContent = ` / ${product.unit}`;
    $('product-dialog-details').replaceChildren(...product.details.map((text) => create('li', '', text)));
    document.body.classList.add('shop-modal-open');
    detailDialog.showModal();
  }
  function renderProducts() {
    const visible = selectProducts({ category, search: searchInput.value, sort: sortInput.value });
    const cards = visible.map((product) => {
      const card = create('article', 'product-card');
      const picture = create('button', 'product-image'); picture.type = 'button'; picture.setAttribute('aria-label', `Ver detalhes: ${product.name}`);
      const image = create('img'); image.src = product.image; image.alt = `Ilustração de ${product.name.toLocaleLowerCase('pt-BR')}`; image.width = 640; image.height = 640; image.loading = 'lazy';
      const view = create('span', 'product-view', 'Ver detalhes ↗'); view.setAttribute('aria-hidden', 'true');
      picture.append(image, view); picture.addEventListener('click', () => openProduct(product, picture));
      const copy = create('div', 'product-copy');
      const label = create('p', 'product-category', `${product.categoryLabel} / ${product.unit}`);
      const title = create('h3', '', product.name);
      const description = create('p', 'product-description', product.description);
      const bottom = create('div', 'product-bottom');
      const price = create('span', 'product-price', formatShopPrice(product.priceCents));
      const add = create('button', 'product-add', 'Adicionar +'); add.type = 'button'; add.setAttribute('aria-label', `Adicionar ${product.name} ao carrinho`); add.addEventListener('click', () => addProduct(product));
      bottom.append(price, add); copy.append(label, title, description, bottom); card.append(picture, copy);
      return card;
    });
    grid.replaceChildren(...cards);
    $('shop-empty').hidden = visible.length > 0;
    $('shop-result-count').textContent = `${visible.length} ${visible.length === 1 ? 'produto' : 'produtos'}`;
  }
  function changeQuantity(id, delta) {
    const entry = cart.find((item) => item.id === id);
    if (!entry) return;
    const quantity = entry.quantity + delta;
    if (quantity < 1 || quantity > MAX_CART_QUANTITY) return;
    updateCart(cart.map((item) => item.id === id ? { id, quantity } : item));
    const replacement = document.querySelector(`[data-quantity-id="${id}"][data-quantity-delta="${delta}"]`);
    if (replacement && !replacement.disabled) replacement.focus();
    else document.querySelector(`[data-quantity-value="${id}"]`)?.focus();
    status.textContent = `${productById.get(id).name}: ${quantity} ${quantity === 1 ? 'unidade' : 'unidades'}.${storageAvailable ? '' : ' Carrinho disponível apenas nesta página.'}`;
  }
  function renderCart() {
    const summary = cartSummary(cart);
    document.querySelectorAll('[data-cart-count]').forEach((node) => { node.textContent = String(summary.quantity); });
    document.querySelectorAll('[data-cart-count-label]').forEach((node) => { node.textContent = `${summary.quantity} ${summary.quantity === 1 ? 'item' : 'itens'} no carrinho`; });
    $('cart-empty').hidden = summary.items.length > 0;
    $('cart-items').hidden = summary.items.length === 0;
    $('cart-clear').hidden = summary.items.length === 0;
    $('cart-clear-confirm').hidden = true;
    $('cart-total').textContent = formatShopPrice(summary.totalCents);
    const checkout = $('cart-checkout');
    checkout.setAttribute('aria-disabled', String(!summary.items.length));
    if (summary.items.length) { checkout.href = orderWhatsAppUrl(cart); checkout.removeAttribute('tabindex'); }
    else { checkout.removeAttribute('href'); checkout.tabIndex = -1; }
    const rows = summary.items.map(({ product, quantity, subtotalCents }) => {
      const row = create('article', 'cart-row');
      const image = create('img', 'cart-row-image'); image.src = product.image; image.alt = ''; image.width = 100; image.height = 100;
      const content = create('div', 'cart-row-content');
      content.append(create('h3', '', product.name), create('p', '', `${formatShopPrice(product.priceCents)} / ${product.unit}`));
      const controls = create('div', 'cart-quantity'); controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', `Quantidade de ${product.name}`);
      for (const delta of [-1, 1]) {
        const button = create('button', 'quantity-button', delta < 0 ? '−' : '+'); button.type = 'button'; button.dataset.quantityId = product.id; button.dataset.quantityDelta = String(delta);
        button.setAttribute('aria-label', `${delta < 0 ? 'Diminuir' : 'Aumentar'} quantidade de ${product.name}`);
        button.disabled = delta < 0 ? quantity <= 1 : quantity >= MAX_CART_QUANTITY;
        button.addEventListener('click', () => changeQuantity(product.id, delta));
        if (delta > 0) { const amount = create('span', '', String(quantity)); amount.dataset.quantityValue = product.id; amount.tabIndex = -1; controls.append(amount); }
        controls.append(button);
      }
      const remove = create('button', 'cart-remove', 'Remover'); remove.type = 'button'; remove.setAttribute('aria-label', `Remover ${product.name} do carrinho`);
      remove.addEventListener('click', () => { updateCart(cart.filter((item) => item.id !== product.id), `${product.name} removido do carrinho.`); $('cart-close').focus(); });
      content.append(controls, remove);
      row.append(image, content, create('strong', 'cart-row-price', formatShopPrice(subtotalCents)));
      return row;
    });
    $('cart-items').replaceChildren(...rows);
  }

  readCart(); renderProducts(); renderCart();
  document.querySelectorAll('[data-open-cart]').forEach((button) => button.addEventListener('click', () => openCart(button)));
  document.querySelectorAll('[data-shop-filter]').forEach((button) => button.addEventListener('click', () => {
    if (!categories.some((item) => item.id === button.dataset.shopFilter)) return;
    category = button.dataset.shopFilter;
    document.querySelectorAll('[data-shop-filter]').forEach((item) => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    renderProducts();
  }));
  searchInput.addEventListener('input', renderProducts);
  sortInput.addEventListener('change', renderProducts);
  $('shop-reset').addEventListener('click', () => {
    category = 'all'; searchInput.value = ''; sortInput.value = 'featured';
    document.querySelectorAll('[data-shop-filter]').forEach((item) => { const active = item.dataset.shopFilter === 'all'; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    renderProducts(); searchInput.focus();
  });
  $('product-dialog-close').addEventListener('click', () => detailDialog.close());
  $('product-dialog-add').addEventListener('click', () => {
    if (!selectedProduct) return;
    const opener = returnTo;
    if (!addProduct(selectedProduct, false)) return;
    detailDialog.close(); openCart(opener);
    notify(`${selectedProduct.name} adicionado ao carrinho.`);
  });
  $('cart-close').addEventListener('click', closeCart);
  $('cart-browse').addEventListener('click', () => { closeCart(); $('catalogo').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
  $('cart-checkout').addEventListener('click', (event) => { if (!cart.length) event.preventDefault(); });
  $('cart-clear').addEventListener('click', () => { $('cart-clear-confirm').hidden = false; $('cart-clear-no').focus(); });
  $('cart-clear-no').addEventListener('click', () => { $('cart-clear-confirm').hidden = true; $('cart-clear').focus(); });
  $('cart-clear-yes').addEventListener('click', () => { updateCart([], 'Carrinho limpo. A lista foi apagada deste navegador.'); $('cart-browse').focus(); });
  for (const dialog of [detailDialog, cartDialog]) {
    dialog.addEventListener('close', () => {
      if (!detailDialog.open && !cartDialog.open) {
        document.body.classList.remove('shop-modal-open');
        if (returnTo?.isConnected) returnTo.focus();
      }
    });
    dialog.addEventListener('click', (event) => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); });
  }
  window.addEventListener('storage', (event) => {
    if (event.key !== CART_KEY && event.key !== null) return;
    const active = document.activeElement;
    const rowHadFocus = cartDialog.open && active && $('cart-items').contains(active);
    const focusId = rowHadFocus ? active.dataset.quantityId || active.dataset.quantityValue : '';
    const focusDelta = rowHadFocus ? active.dataset.quantityDelta : undefined;
    readCart(); renderCart();
    if (rowHadFocus) {
      const selector = focusId
        ? focusDelta !== undefined
          ? `[data-quantity-id="${focusId}"][data-quantity-delta="${focusDelta}"]`
          : `[data-quantity-value="${focusId}"]`
        : '';
      const replacement = selector ? cartDialog.querySelector(selector) : null;
      (replacement && !replacement.disabled ? replacement : $('cart-close')).focus();
    }
    status.textContent = storageAvailable ? 'Seu carrinho foi atualizado em outra aba.' : 'Não foi possível ler o carrinho da outra aba.';
  });
}
