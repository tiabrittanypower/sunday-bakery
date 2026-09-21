const base = process.env.BASE_URL || "http://localhost:3001";

async function main() {
  const health = await fetch(`${base}/api/health`).then((r) => r.json());
  console.log("health", health);

  const newsletter = await fetch(`${base}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "tia-test@example.com" }),
  }).then((r) => r.json());
  console.log("newsletter", newsletter);

  const order = await fetch(`${base}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Tia",
      lastName: "Baker",
      email: "customer@example.com",
      phone: "0821234567",
      slot: "08:00–08:30",
      quantity: 2,
      note: "Extra napkins",
    }),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  console.log("order", JSON.stringify(order, null, 2));

  const config = await fetch(`${base}/api/config`).then((r) => r.json());
  console.log("availability", config.availability);

  // Reject overselling beyond remaining
  const soldOutAttempt = await fetch(`${base}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Max",
      lastName: "Out",
      email: "max@example.com",
      phone: "0820000000",
      slot: "08:30–09:00",
      quantity: 99,
    }),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  console.log("oversell", soldOutAttempt);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
