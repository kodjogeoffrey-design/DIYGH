import test from "node:test";
import assert from "node:assert/strict";
import { listProducts, getProduct, listCategories } from "../src/api/catalog.js";
import { products } from "../src/data/products.js";

const REQUIRED_FIELDS = [
  "id",
  "name",
  "sku",
  "price",
  "category",
  "image_url",
  "short_description",
  "stock_status",
  "rating",
  "created_date",
];

const VALID_CATEGORIES = ["Boards", "Sensors", "Motors", "Components", "Kits", "Tools"];

test("every product has the required fields", () => {
  assert.ok(products.length >= 12, "expected a reasonably full seed catalog");
  for (const product of products) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(product[field] !== undefined && product[field] !== null, `${product.id} missing ${field}`);
    }
    assert.ok(VALID_CATEGORIES.includes(product.category), `${product.id} has bad category`);
    assert.ok(product.price > 0, `${product.id} price must be positive`);
    assert.ok(
      product.image_url.startsWith("data:image/svg+xml") ||
        product.image_url.startsWith("/images/"),
      `${product.id} image must be a local SVG data URI or /images/ path`
    );
    assert.ok(!product.image_url.includes("base44"), `${product.id} image must not reference base44`);
  }
});

test("product ids are unique", () => {
  const ids = products.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("listProducts returns newest first by default", async () => {
  const list = await listProducts();
  assert.equal(list.length, products.length);
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i - 1].created_date >= list[i].created_date, "expected descending created_date");
  }
});

test("listProducts honors sort and limit", async () => {
  const cheap = await listProducts("price", 3);
  assert.equal(cheap.length, 3);
  assert.ok(cheap[0].price <= cheap[1].price);
  assert.ok(cheap[1].price <= cheap[2].price);

  const named = await listProducts("name", 5);
  for (let i = 1; i < named.length; i++) {
    assert.ok(named[i - 1].name.localeCompare(named[i].name) <= 0);
  }
});

test("getProduct finds a product and returns null for unknown ids", async () => {
  const first = products[0];
  const found = await getProduct(first.id);
  assert.equal(found?.id, first.id);
  assert.equal(await getProduct("does-not-exist"), null);
});

test("listCategories matches the seed data", () => {
  const expected = [...new Set(products.map((p) => p.category))];
  assert.deepEqual(listCategories().sort(), expected.sort());
});

test("at least one product is featured in Kits", async () => {
  const list = await listProducts();
  assert.ok(list.some((p) => p.featured && p.category === "Kits"));
});
