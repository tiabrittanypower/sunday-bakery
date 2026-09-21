const nodemailer = require("nodemailer");

let transporterPromise = null;

function hasSmtp() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function getTransporter() {
  if (!hasSmtp()) return null;
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    );
  }
  return transporterPromise;
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || "Sunday Bakery <orders@sundaybakery.co.za>";
  const transporter = await getTransporter();

  if (!transporter) {
    console.log("\n--- EMAIL (console only — set SMTP_* to send for real) ---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("---\n");
    return { queued: false, mode: "console" };
  }

  await transporter.sendMail({ from, to, subject, text, html: html || text });
  return { queued: true, mode: "smtp" };
}

function formatOrderText(order, config) {
  return [
    `Order ${order.id}`,
    `Status: ${order.status}`,
    "",
    `Customer: ${order.firstName} ${order.lastName}`,
    `Email: ${order.email}`,
    `Phone: ${order.phone}`,
    "",
    `${order.quantity} × ${config.product.name} — R${order.total}`,
    `Collection: ${config.collectionLabel}`,
    `Pickup slot: ${order.slot}`,
    `Location: ${config.collectionAddress}`,
    order.note ? `Note: ${order.note}` : null,
    "",
    `Bake #${config.bakeNumber}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendOrderConfirmation(order, config) {
  const subject = `Sunday Bakery order ${order.id} confirmed`;
  const text = [
    `Hi ${order.firstName},`,
    "",
    "Your Sunday bake is booked. See you at collection.",
    "",
    formatOrderText(order, config),
    "",
    "Questions? Reply to this email or write to hello@sundaybakery.co.za",
    "",
    "— Tia, Sunday Bakery",
  ].join("\n");

  return sendMail({ to: order.email, subject, text });
}

async function notifyBaker(order, config) {
  const baker = process.env.BAKER_EMAIL;
  if (!baker) {
    console.log("[baker notify] BAKER_EMAIL not set; skipping baker email");
    return { queued: false, mode: "skipped" };
  }

  const subject = `New order ${order.id} · ${order.quantity}× box · ${order.slot}`;
  const text = formatOrderText(order, config);
  return sendMail({ to: baker, subject, text });
}

async function notifyNewsletterSignup(email) {
  const baker = process.env.BAKER_EMAIL;
  if (!baker) return { queued: false, mode: "skipped" };
  return sendMail({
    to: baker,
    subject: `Newsletter signup: ${email}`,
    text: `${email} joined the Sunday Bakery list.`,
  });
}

module.exports = {
  sendOrderConfirmation,
  notifyBaker,
  notifyNewsletterSignup,
  hasSmtp,
};
