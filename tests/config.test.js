import test from "node:test";
import assert from "node:assert/strict";
import {
  formatPrice,
  buildWhatsAppLink,
  productBuyMessage,
  cartCheckoutMessage,
  formatWhatsApp,
  WHATSAPP_NUMBER,
  STORE_NAME,
  STORE_TAGLINE,
  splitStoreTagline,
} from "../src/lib/config.js";

test("the default tagline has a white lead and yellow accent", () => {
  assert.deepEqual(splitStoreTagline(STORE_TAGLINE), ["The Hardware behind", "the innovation"]);
});

test("formatPrice renders Ghana cedi amounts", () => {
  assert.equal(formatPrice(690), "GH₵ 690");
  assert.equal(formatPrice(1650), "GH₵ 1,650");
});

test("WHATSAPP_NUMBER is the real Ghana line", () => {
  assert.equal(WHATSAPP_NUMBER, "233243895567");
  assert.equal(formatWhatsApp(WHATSAPP_NUMBER), "+233 24 389 5567");
});

test("WHATSAPP_NUMBER is the real Ghana line and formats cleanly", () => {
  assert.equal(WHATSAPP_NUMBER, "233243895567");
  assert.equal(formatWhatsApp(), "+233 24 389 5567");
  assert.equal(formatWhatsApp("233501234567"), "+233 50 123 4567");
});

test("buildWhatsAppLink encodes the message and number", () => {
  const link = buildWhatsAppLink("Hi ROBOHUB, stock check?");
  assert.ok(link.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`));
  assert.ok(link.includes(encodeURIComponent("Hi ROBOHUB, stock check?")));
});

test("productBuyMessage includes name and sku", () => {
  const message = productBuyMessage({ name: "HC-SR04", sku: "RB-SEN-001" });
  assert.ok(message.includes("HC-SR04"));
  assert.ok(message.includes("RB-SEN-001"));
  assert.ok(message.includes(STORE_NAME.split(" ")[0]));
});

test("cartCheckoutMessage lists every line and the total", () => {
  const items = [
    { name: "Uno", sku: "RB-BRD-001", price: 165, qty: 2 },
    { name: "Servo", sku: "RB-MTR-011", price: 55, qty: 1 },
  ];
  const message = cartCheckoutMessage(items, 385);
  assert.ok(message.includes("1. Uno – RB-BRD-001 x2 = GH₵ 330"));
  assert.ok(message.includes("2. Servo – RB-MTR-011 x1 = GH₵ 55"));
  assert.ok(message.includes("Total: GH₵ 385"));
});
