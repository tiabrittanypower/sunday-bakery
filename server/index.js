require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const store = require("./store");
const payfast = require("./payfast");
const email = require("./email");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, "..");
const RECIPES_DIR = path.join(ROOT, "data", "recipes");
const paymentMode = () => (process.env.PAYMENT_MODE || "demo").toLowerCase();

/** Order statuses that count toward kitchen “ordered boxes” (exclude pending / failed / cancelled). */
const KITCHEN_COUNTED_STATUSES = new Set([
  "paid",
  "paid_demo",
  "confirmed",
  "complete",
]);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function publicConfig() {
  const config = store.getConfig();
  const availability = store.getAvailability(config);
  return {
    bakeNumber: config.bakeNumber,
    collectionDate: config.collectionDate,
    collectionLabel: config.collectionLabel,
    collectionLocation: config.collectionLocation,
    collectionAddress: config.collectionAddress,
    ordersCloseAt: config.ordersCloseAt,
    slots: config.slots,
    announcement: config.announcement,
    product: config.product,
    availability,
    paymentMode: paymentMode(),
  };
}

function newOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `SUN-${stamp.slice(-5)}${rand.slice(0, 2)}`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, paymentMode: paymentMode() });
});

app.get("/api/config", (_req, res) => {
  try {
    res.json(publicConfig());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load weekly config" });
  }
});

app.post("/api/newsletter", async (req, res) => {
  try {
    const emailAddress = String(req.body.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const { subscriber, created } = store.addNewsletterSubscriber(emailAddress);
    if (created) {
      await email.notifyNewsletterSignup(subscriber.email);
    }

    res.json({
      ok: true,
      created,
      message: created
        ? "You’re on the list — see you Tuesday."
        : "You’re already on the list. See you Tuesday.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not join the list right now." });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const config = store.getConfig();
    const availability = store.getAvailability(config);
    const body = req.body || {};

    if (!availability.ordersOpen) {
      return res.status(400).json({
        error: "Orders for this week’s bake have closed. Check back for next Sunday.",
      });
    }
    if (availability.soldOut) {
      return res.status(400).json({
        error: "This week’s bake is sold out. Join the list for next week.",
      });
    }

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const customerEmail = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const slot = String(body.slot || "").trim();
    const note = String(body.note || "").trim();
    const requested = Number(body.quantity);

    if (!firstName || !lastName || !customerEmail || !phone || !slot) {
      return res.status(400).json({ error: "Please complete all required fields." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!config.slots.includes(slot)) {
      return res.status(400).json({ error: "Please choose a valid pickup time." });
    }
    if (!Number.isFinite(requested) || requested < 1 || !Number.isInteger(requested)) {
      return res.status(400).json({ error: "Please choose a valid quantity." });
    }
    if (requested > availability.maxPerOrder) {
      return res.status(400).json({
        error: `You can order up to ${availability.maxPerOrder} box${availability.maxPerOrder === 1 ? "" : "es"} per order.`,
      });
    }
    if (requested > availability.remaining) {
      return res.status(400).json({
        error: `Only ${availability.remaining} box${availability.remaining === 1 ? "" : "es"} left this week.`,
      });
    }
    const quantity = requested;

    const product = config.product;
    const total = product.price * quantity;
    const id = newOrderId();
    const now = new Date();
    const mode = paymentMode();

    const order = store.createOrder({
      id,
      mPaymentId: id,
      status: mode === "demo" ? "confirmed" : "pending_payment",
      paymentMode: mode,
      bakeNumber: config.bakeNumber,
      collectionLabel: config.collectionLabel,
      collectionAddress: config.collectionAddress,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      total,
      firstName,
      lastName,
      email: customerEmail,
      phone,
      slot,
      note: note || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt:
        mode === "demo"
          ? null
          : new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      paidAt: mode === "demo" ? now.toISOString() : null,
    });

    if (mode === "demo") {
      await email.sendOrderConfirmation(order, config);
      await email.notifyBaker(order, config);
      return res.status(201).json({
        ok: true,
        mode: "demo",
        order: publicOrder(order),
      });
    }

    if (mode === "payfast") {
      const checkout = payfast.buildCheckoutFields(order, config);
      return res.status(201).json({
        ok: true,
        mode: "payfast",
        order: publicOrder(order),
        payfast: checkout,
      });
    }

    return res.status(500).json({
      error: `Unknown PAYMENT_MODE "${mode}". Use "demo" or "payfast".`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Could not create order." });
  }
});

app.get("/api/orders/:id", (req, res) => {
  const order = store.findOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ order: publicOrder(order) });
});

/** PayFast Instant Transaction Notification (ITN) */
app.post("/api/payfast/notify", async (req, res) => {
  try {
    const body = req.body || {};
    console.log("[payfast notify]", body.m_payment_id, body.payment_status);

    if (!payfast.validateItnSignature(body)) {
      console.warn("[payfast notify] invalid signature");
      return res.status(400).send("invalid signature");
    }

    const orderId = body.m_payment_id;
    const order = store.findOrderByPaymentId(orderId);
    if (!order) {
      console.warn("[payfast notify] unknown order", orderId);
      return res.status(404).send("order not found");
    }

    const status = String(body.payment_status || "").toUpperCase();
    if (status === "COMPLETE") {
      if (order.status !== "paid" && order.status !== "confirmed") {
        const updated = store.updateOrder(order.id, {
          status: "paid",
          paidAt: new Date().toISOString(),
          payfastPaymentId: body.pf_payment_id || null,
          payfastRawStatus: status,
        });
        const config = store.getConfig();
        await email.sendOrderConfirmation(updated, config);
        await email.notifyBaker(updated, config);
      }
    } else if (status === "FAILED" || status === "CANCELLED") {
      store.updateOrder(order.id, {
        status: "failed",
        payfastRawStatus: status,
      });
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

function publicOrder(order) {
  return {
    id: order.id,
    status: order.status,
    paymentMode: order.paymentMode,
    bakeNumber: order.bakeNumber,
    collectionLabel: order.collectionLabel,
    collectionAddress: order.collectionAddress,
    productName: order.productName,
    quantity: order.quantity,
    total: order.total,
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    phone: order.phone,
    slot: order.slot,
    note: order.note,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };
}

/**
 * Owner kitchen: month recipe pack for the bake dashboard.
 * Prefers data/recipes/month-1.json; otherwise first data/recipes/*.json.
 */
app.get("/api/recipes", (_req, res) => {
  try {
    let filePath = path.join(RECIPES_DIR, "month-1.json");
    if (!fs.existsSync(filePath)) {
      let candidates = [];
      if (fs.existsSync(RECIPES_DIR)) {
        candidates = fs
          .readdirSync(RECIPES_DIR)
          .filter((name) => name.toLowerCase().endsWith(".json"))
          .sort()
          .map((name) => path.join(RECIPES_DIR, name));
      }
      filePath = candidates[0] || null;
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        error:
          "Recipe data not found. Add data/recipes/month-1.json (or any data/recipes/*.json with a weeks array).",
      });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);

    if (Array.isArray(data.weeks)) {
      return res.json(data);
    }
    if (Array.isArray(data)) {
      return res.json({ weeks: data });
    }

    return res.status(500).json({
      error: "Recipe file must be a weeks array or an object with a weeks array.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load recipes" });
  }
});

/**
 * Owner kitchen: capacity vs firm orders for the current bake.
 * Counts paid / confirmed (and paid_demo / complete); excludes cancelled / failed / pending.
 */
app.get("/api/kitchen/summary", (_req, res) => {
  try {
    const config = store.getConfig();
    const bakeNumber = config.bakeNumber;
    const capacity = Number(config.capacity) || 0;
    const productName =
      (config.product && config.product.name) || null;

    const orderedBoxes = store
      .getOrders()
      .filter(
        (o) =>
          o.bakeNumber === bakeNumber &&
          KITCHEN_COUNTED_STATUSES.has(String(o.status || "").toLowerCase())
      )
      .reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

    res.json({
      bakeNumber,
      capacity,
      orderedBoxes,
      remaining: Math.max(0, capacity - orderedBoxes),
      ordersCloseAt: config.ordersCloseAt,
      productName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load kitchen summary" });
  }
});

app.use(express.static(ROOT, { extensions: ["html"] }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Sunday Bakery running at http://localhost:${PORT}`);
  console.log(`Payment mode: ${paymentMode()}`);
  if (!email.hasSmtp()) {
    console.log("SMTP not configured — order emails will print to this console.");
  }
});
