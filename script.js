/** @typedef {{ id: string, name: string, price: number, description: string, allergens: string, tag: string, contents?: string[] }} Product */

let config = null;
/** @type {Product[]} */
let products = [];
let cart = JSON.parse(localStorage.getItem("sunday-bakery-cart") || "{}");

const money = (value) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);

const getItems = () =>
  products.filter((p) => cart[p.id]).map((p) => ({ ...p, quantity: cart[p.id] }));
const getCount = () => Object.values(cart).reduce((sum, n) => sum + n, 0);
const getTotal = () => getItems().reduce((sum, item) => sum + item.price * item.quantity, 0);

const drawer = document.querySelector("[data-cart]");
const checkout = document.querySelector("[data-checkout]");
const overlay = document.querySelector("[data-overlay]");

function availability() {
  return config?.availability || {
    canOrder: true,
    soldOut: false,
    ordersOpen: true,
    remaining: 99,
    maxPerOrder: 4,
    percentSpokenFor: 0,
  };
}

function clampCartToStock() {
  const avail = availability();
  const product = products[0];
  if (!product) return;
  const qty = cart[product.id] || 0;
  if (!qty) return;
  const max = Math.min(avail.maxPerOrder, Math.max(0, avail.remaining));
  if (qty > max) {
    if (max <= 0) delete cart[product.id];
    else cart[product.id] = max;
    localStorage.setItem("sunday-bakery-cart", JSON.stringify(cart));
  }
}

function applyConfigToPage() {
  if (!config) return;

  const announce = document.querySelector("[data-announcement-text]");
  if (announce) announce.textContent = config.announcement || "This week’s bake closes Friday at 18:00";

  document.querySelectorAll("[data-collection-label]").forEach((el) => {
    el.textContent = config.collectionLabel;
  });
  document.querySelectorAll("[data-collection-location]").forEach((el) => {
    el.textContent = config.collectionLocation;
  });
  document.querySelectorAll("[data-collection-address]").forEach((el) => {
    el.textContent = config.collectionAddress;
  });
  document.querySelectorAll("[data-bake-label]").forEach((el) => {
    el.textContent = `Bake no. ${config.bakeNumber} · ${config.collectionLabel.replace(/^Sunday,\s*/i, "")}`;
  });

  const avail = availability();
  const availabilityEl = document.querySelector("[data-availability]");
  if (availabilityEl) {
    let message;
    if (!avail.ordersOpen) {
      message = "Orders for this week’s bake have closed";
    } else if (avail.soldOut) {
      message = "This week’s bake is sold out";
    } else if (avail.remaining <= 5) {
      message = `Only ${avail.remaining} box${avail.remaining === 1 ? "" : "es"} left this week`;
    } else {
      message = `${avail.percentSpokenFor}% of this week’s bake is spoken for`;
    }
    availabilityEl.innerHTML = `<span><i></i> ${message}</span><span>Allergens are listed on each item.</span>`;
  }
}

function boxContentsHtml(product) {
  const contents = product.contents || ["One cake", "One bun", "One tart", "One pastry"];
  return contents
    .map(
      (label, i) =>
        `<li><span class="box-num">${String(i + 1).padStart(2, "0")}</span><span class="box-label">${label}</span></li>`
    )
    .join("");
}

function renderProducts() {
  const root = document.querySelector("[data-products]");
  if (!root) return;
  const avail = availability();

  root.innerHTML = products
    .map((p) => {
      let buttonLabel = "Add one box";
      let disabled = false;
      if (!avail.ordersOpen) {
        buttonLabel = "Orders closed";
        disabled = true;
      } else if (avail.soldOut) {
        buttonLabel = "Sold out";
        disabled = true;
      }

      return `
    <article class="product">
      <div class="product-media">
        <div class="product-image" role="img" aria-label="${p.name}"></div>
        <span class="product-tag">${p.tag}</span>
      </div>
      <div class="product-body">
        <div class="product-kicker">This week’s selection</div>
        <div class="product-title">
          <h3>${p.name}</h3>
          <p class="product-price">${money(p.price)}</p>
        </div>
        <p class="product-desc">${p.description}</p>
        <div class="box-panel">
          <p class="box-panel-label">Inside the box</p>
          <ul class="box-contents">${boxContentsHtml(p)}</ul>
        </div>
        <p class="product-allergens">${p.allergens}</p>
        <div class="product-actions">
          <button class="add" data-add="${p.id}" ${disabled ? "disabled" : ""}>${buttonLabel}</button>
          <span class="product-meta">Collect ${config?.collectionLabel || "Sunday"} · East Rand</span>
        </div>
      </div>
    </article>`;
    })
    .join("");
}

function saveCart() {
  localStorage.setItem("sunday-bakery-cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = getCount();
  });
  const body = document.querySelector("[data-cart-body]");
  const foot = document.querySelector("[data-cart-foot]");
  if (!body || !foot) return;

  if (!getCount()) {
    body.innerHTML = `<div class="empty"><div><b>☼</b><h3>Your basket is still sleeping.</h3><p>Add something flaky from this week’s bake<br>and give it a reason to wake up.</p></div></div>`;
    foot.innerHTML = `<a href="#menu" class="checkout-button" data-close style="display:block;text-align:center;text-decoration:none">Browse this week’s bake</a>`;
    return;
  }

  body.innerHTML = getItems()
    .map(
      (i) => `<div class="cart-item"><div class="cart-thumb"></div><div><h4>${i.name}</h4><p>${money(i.price)} each</p><div class="qty"><button data-quantity="${i.id}" data-change="-1">−</button><span>${i.quantity}</span><button data-quantity="${i.id}" data-change="1">+</button></div></div><b class="cart-price">${money(i.price * i.quantity)}</b></div>`
    )
    .join("");

  const avail = availability();
  const label = config?.collectionLabel || "Sunday collection";
  let cta = `<button class="checkout-button" data-start-checkout>Choose pickup & checkout</button>`;
  if (!avail.canOrder) {
    cta = `<button class="checkout-button" disabled>${avail.soldOut ? "Sold out" : "Orders closed"}</button>`;
  }

  foot.innerHTML = `<div class="total"><span>Total</span><span>${money(getTotal())}</span></div>${cta}<small>Collection ${label} · Boksburg / Kempton Park</small>`;
}

function showLayer(layer) {
  overlay.classList.add("open");
  layer.classList.add("open");
  layer.setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
}

function closeLayers() {
  overlay.classList.remove("open");
  drawer.classList.remove("open");
  checkout.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  checkout.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lock");
}

function toast(message) {
  const el = document.querySelector("[data-toast]");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function paymentNote() {
  const mode = config?.paymentMode || "demo";
  if (mode === "payfast") {
    return "You’ll pay securely with PayFast (card / EFT). Your box is reserved for 30 minutes while you complete payment.";
  }
  return "Demo mode: your order is confirmed without taking a card payment. Set PAYMENT_MODE=payfast on the server for live checkout.";
}

function openCheckout() {
  const avail = availability();
  if (!avail.canOrder) {
    toast(avail.soldOut ? "This week’s bake is sold out" : "Orders have closed for this week");
    return;
  }
  if (!getCount()) {
    toast("Your basket is empty");
    return;
  }

  drawer.classList.remove("open");
  const slots = config?.slots || ["08:00–08:30", "08:30–09:00", "09:30–10:00", "10:30–11:00"];

  document.querySelector("[data-checkout-content]").innerHTML = `
    <h2>Nearly yours.</h2><p class="checkout-sub">Tell us who we’re baking for and when you’ll collect.</p>
    <form class="checkout-grid" id="order-form">
      <div>
        <h3>Your details</h3>
        <div class="form-row">
          <div class="field"><label>First name</label><input name="firstName" autocomplete="given-name" required></div>
          <div class="field"><label>Last name</label><input name="lastName" autocomplete="family-name" required></div>
        </div>
        <div class="field"><label>Email address</label><input name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label>Mobile number</label><input name="phone" type="tel" autocomplete="tel" placeholder="082 123 4567" required></div>
        <h3 style="margin-top:28px">Pickup time</h3>
        <div class="slots">${slots
          .map(
            (s, i) =>
              `<div class="slot"><input id="slot-${i}" type="radio" name="slot" value="${s}" ${i === 0 ? "checked" : ""}><label for="slot-${i}">${s}</label></div>`
          )
          .join("")}</div>
        <div class="field"><label>Order note (optional)</label><input name="note" placeholder="Anything we should know?"></div>
      </div>
      <aside>
        <h3>Order summary</h3>
        ${getItems()
          .map(
            (i) =>
              `<div class="summary-line"><span>${i.quantity} × ${i.name}</span><span>${money(i.price * i.quantity)}</span></div>`
          )
          .join("")}
        <div class="summary-line summary-total"><strong>Total</strong><strong>${money(getTotal())}</strong></div>
        <p class="payment-note">${paymentNote()}</p>
        <button class="order-button" type="submit" data-order-submit>Confirm order · ${money(getTotal())}</button>
        <p class="checkout-error" data-checkout-error hidden></p>
      </aside>
    </form>`;
  showLayer(checkout);
}

function showConfirmation(order) {
  document.querySelector("[data-done]")?.classList.add("done");
  document.querySelector("[data-checkout-content]").innerHTML = `
    <div class="confirmation">
      <div class="confirm-mark">✓</div>
      <p class="eyebrow">Order ${order.id}</p>
      <h2>See you Sunday.</h2>
      <p>Thanks, ${order.firstName}. Your bake is booked. A confirmation has been sent to <strong>${order.email}</strong>.</p>
      <div class="confirm-card">
        <div><span>Collection</span><strong>${order.collectionLabel}</strong></div>
        <div><span>Pickup time</span><strong>${order.slot}</strong></div>
        <div><span>Location</span><strong>${order.collectionAddress}</strong></div>
        <div><span>Order total</span><strong>${money(order.total)}</strong></div>
      </div>
      <button class="order-button" data-close style="max-width:500px;margin-top:22px">Back to the bakery</button>
    </div>`;
}

function postPayfastForm(action, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

async function submitOrder(form) {
  const data = new FormData(form);
  const items = getItems();
  if (!items.length) {
    toast("Your basket is empty");
    return;
  }

  const quantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const errorEl = form.querySelector("[data-checkout-error]");
  const submitBtn = form.querySelector("[data-order-submit]");
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing order…";
  }

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: data.get("firstName"),
        lastName: data.get("lastName"),
        email: data.get("email"),
        phone: data.get("phone"),
        slot: data.get("slot"),
        note: data.get("note"),
        quantity,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload.error || "Could not place order");
    }

    if (payload.mode === "demo") {
      cart = {};
      saveCart();
      await refreshConfig();
      showConfirmation(payload.order);
      toast("Order confirmed");
      return;
    }

    if (payload.mode === "payfast" && payload.payfast) {
      cart = {};
      saveCart();
      postPayfastForm(payload.payfast.action, payload.payfast.fields);
      return;
    }

    throw new Error("Unexpected payment response");
  } catch (err) {
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = err.message || "Something went wrong";
    } else {
      toast(err.message || "Something went wrong");
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = `Confirm order · ${money(getTotal())}`;
    }
  }
}

async function submitNewsletter(form) {
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector("button");
  const message = document.querySelector("[data-newsletter-message]");
  const emailValue = input?.value?.trim();
  if (!emailValue) return;

  button.disabled = true;
  try {
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailValue }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || "Could not join the list");

    input.value = "";
    button.textContent = "You’re in ✓";
    if (message) message.textContent = payload.message || "You’re on the list — see you Tuesday.";
  } catch (err) {
    if (message) message.textContent = err.message || "Could not join right now.";
    button.disabled = false;
  }
}

document.addEventListener("click", (event) => {
  const add = event.target.closest("[data-add]");
  if (add && !add.disabled) {
    const avail = availability();
    if (!avail.canOrder) {
      toast(avail.soldOut ? "Sold out this week" : "Orders closed");
      return;
    }
    const p = products.find((item) => item.id === add.dataset.add);
    if (!p) return;
    const next = (cart[p.id] || 0) + 1;
    const max = Math.min(avail.maxPerOrder, avail.remaining);
    if (next > max) {
      toast(
        max <= 0
          ? "No boxes left"
          : `You can order up to ${max} box${max === 1 ? "" : "es"} this week`
      );
      return;
    }
    cart[p.id] = next;
    saveCart();
    toast(`${p.name} added to your basket`);
  }

  if (event.target.closest("[data-open-cart]")) showLayer(drawer);
  if (event.target.closest("[data-close]")) closeLayers();

  const quantity = event.target.closest("[data-quantity]");
  if (quantity) {
    const id = quantity.dataset.quantity;
    const change = Number(quantity.dataset.change);
    const avail = availability();
    let next = Math.max(0, (cart[id] || 0) + change);
    if (change > 0) {
      const max = Math.min(avail.maxPerOrder, avail.remaining);
      next = Math.min(next, max);
    }
    if (!next) delete cart[id];
    else cart[id] = next;
    saveCart();
  }

  if (event.target.closest("[data-start-checkout]")) openCheckout();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "order-form") {
    event.preventDefault();
    if (event.target.reportValidity()) submitOrder(event.target);
  }
  if (event.target.id === "newsletter") {
    event.preventDefault();
    submitNewsletter(event.target);
  }
});

overlay.addEventListener("click", closeLayers);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLayers();
});

let installPrompt;
const installButton = document.querySelector("[data-install]");
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = false;
});
if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
}
window.addEventListener("appinstalled", () => toast("Sunday Bakery is installed"));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}

async function refreshConfig() {
  const res = await fetch("/api/config", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load this week’s bake");
  config = await res.json();
  products = config.product ? [config.product] : [];
  clampCartToStock();
  applyConfigToPage();
  renderProducts();
  renderCart();
  return config;
}

async function boot() {
  try {
    await refreshConfig();
  } catch (err) {
    console.error(err);
    // Fallback so the page still works if opened as a plain file (no server)
    products = [
      {
        id: "box",
        name: "The Sunday box",
        price: 245,
        description:
          "A fixed weekly selection containing one slice of cake, one bun, one seasonal tart and one handcrafted pastry.",
        allergens: "Wheat · gluten · dairy · egg · may contain nuts",
        tag: "One box · four bakes",
        contents: ["One cake", "One bun", "One tart", "One pastry"],
      },
    ];
    config = {
      bakeNumber: 1,
      collectionLabel: "Sunday, 26 July",
      collectionLocation: "Boksburg / Kempton Park · 09:00–11:00",
      collectionAddress: "Boksburg / Kempton Park — exact collection point confirmed on your order",
      slots: ["09:00–09:30", "09:30–10:00", "10:00–10:30", "10:30–11:00"],
      announcement: "East Rand pilot · closes Friday 18:00",
      paymentMode: "demo",
      availability: {
        canOrder: true,
        soldOut: false,
        ordersOpen: true,
        remaining: 12,
        maxPerOrder: 2,
        percentSpokenFor: 0,
      },
    };
    applyConfigToPage();
    renderProducts();
    renderCart();
    toast("Start the server (npm start) for live orders");
  }
}

boot();
