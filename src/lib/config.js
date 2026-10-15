// DIYGH Store configuration
// WhatsApp number in international format, country code first, no + or spaces.
export const WHATSAPP_NUMBER = "233243895567";
export const STORE_NAME = "DIYGH Store";
export const STORE_TAGLINE = "Build. Learn. Innovate.";
export const STORE_TAGLINE_ACCENT = "Innovate";
export const CURRENCY = "GH₵";

export function splitStoreTagline(value = STORE_TAGLINE) {
  const text = String(value || "").trim();
  if (!text) return ["Build. Learn.", STORE_TAGLINE_ACCENT];
  if (text === STORE_TAGLINE) return ["Build. Learn.", STORE_TAGLINE_ACCENT];
  const match = text.match(/^(.*?[.!?])\s+(.*)$/);
  if (match) return [match[1], match[2]];
  return [text, ""];
}

export function formatPrice(value) {
  return `${CURRENCY} ${Number(value).toLocaleString("en-GH", { minimumFractionDigits: 0 })}`;
}

export function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Pretty display form of the WhatsApp number, e.g. +233 24 389 5567. */
export function formatWhatsApp(number = WHATSAPP_NUMBER) {
  const digits = String(number).replace(/\D/g, "");
  if (digits.length < 10) return `+${digits}`;
  const country = digits.slice(0, -9);
  const rest = digits.slice(-9);
  return `+${country} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
}

export function productBuyMessage(product) {
  return `Hi DIYGH, I want to buy the ${product.name} – ${product.sku}. Is it in stock?`;
}

export function cartCheckoutMessage(items, total) {
  const lines = items
    .map((it, i) => `${i + 1}. ${it.name} – ${it.sku} x${it.qty} = ${formatPrice(it.price * it.qty)}`)
    .join("\n");
  return `Hi DIYGH, I'd like to complete this build:\n\n${lines}\n\nTotal: ${formatPrice(total)}\n\nIs everything in stock?`;
}