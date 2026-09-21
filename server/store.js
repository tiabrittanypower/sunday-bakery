const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");
const NEWSLETTER_PATH = path.join(DATA_DIR, "newsletter.json");

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_PATH)) fs.writeFileSync(ORDERS_PATH, "[]\n", "utf8");
  if (!fs.existsSync(NEWSLETTER_PATH)) fs.writeFileSync(NEWSLETTER_PATH, "[]\n", "utf8");
}

function readJson(filePath, fallback) {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDataFiles();
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getConfig() {
  const config = readJson(CONFIG_PATH, null);
  if (!config) throw new Error("Missing data/config.json");
  return config;
}

function getOrders() {
  return readJson(ORDERS_PATH, []);
}

function saveOrders(orders) {
  writeJson(ORDERS_PATH, orders);
}

function getNewsletter() {
  return readJson(NEWSLETTER_PATH, []);
}

function saveNewsletter(list) {
  writeJson(NEWSLETTER_PATH, list);
}

function countSoldForBake(bakeNumber) {
  return getOrders()
    .filter(
      (o) =>
        o.bakeNumber === bakeNumber &&
        (o.status === "paid" || o.status === "confirmed")
    )
    .reduce((sum, o) => sum + (o.quantity || 0), 0);
}

function countReservedForBake(bakeNumber) {
  const now = Date.now();
  return getOrders()
    .filter((o) => {
      if (o.bakeNumber !== bakeNumber) return false;
      if (o.status === "paid" || o.status === "confirmed") return true;
      if (o.status === "pending_payment" && o.expiresAt) {
        return new Date(o.expiresAt).getTime() > now;
      }
      return false;
    })
    .reduce((sum, o) => sum + (o.quantity || 0), 0);
}

function getAvailability(config = getConfig()) {
  const sold = countSoldForBake(config.bakeNumber);
  const reserved = countReservedForBake(config.bakeNumber);
  const capacity = Number(config.capacity) || 0;
  const remaining = Math.max(0, capacity - reserved);
  const percentSpokenFor =
    capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
  const ordersOpen = new Date(config.ordersCloseAt).getTime() > Date.now();
  const soldOut = remaining <= 0;

  return {
    capacity,
    sold,
    reserved,
    remaining,
    percentSpokenFor,
    ordersOpen,
    soldOut,
    canOrder: ordersOpen && !soldOut,
    maxPerOrder: Number(config.maxPerOrder) || 4,
    closesAt: config.ordersCloseAt,
  };
}

function createOrder(order) {
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
}

function updateOrder(id, patch) {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  orders[index] = { ...orders[index], ...patch, updatedAt: new Date().toISOString() };
  saveOrders(orders);
  return orders[index];
}

function findOrder(id) {
  return getOrders().find((o) => o.id === id) || null;
}

function findOrderByPaymentId(mPaymentId) {
  return getOrders().find((o) => o.mPaymentId === mPaymentId || o.id === mPaymentId) || null;
}

function addNewsletterSubscriber(email) {
  const list = getNewsletter();
  const normalized = email.trim().toLowerCase();
  const existing = list.find((e) => e.email === normalized);
  if (existing) {
    return { subscriber: existing, created: false };
  }
  const subscriber = {
    email: normalized,
    subscribedAt: new Date().toISOString(),
  };
  list.push(subscriber);
  saveNewsletter(list);
  return { subscriber, created: true };
}

module.exports = {
  getConfig,
  getAvailability,
  createOrder,
  updateOrder,
  findOrder,
  findOrderByPaymentId,
  countSoldForBake,
  addNewsletterSubscriber,
  getOrders,
  getNewsletter,
};
