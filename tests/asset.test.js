import test from "node:test";
import assert from "node:assert/strict";
import { assetUrl } from "../src/lib/asset.js";

test("assetUrl leaves data URIs and absolute URLs alone", () => {
  assert.equal(assetUrl("data:image/svg+xml,abc"), "data:image/svg+xml,abc");
  assert.equal(assetUrl("https://example.com/a.jpg"), "https://example.com/a.jpg");
  assert.equal(assetUrl("http://example.com/a.jpg"), "http://example.com/a.jpg");
  assert.equal(assetUrl("//cdn.example.com/a.jpg"), "//cdn.example.com/a.jpg");
});

test("assetUrl prefixes root-relative paths with the base", () => {
  assert.equal(assetUrl("/images/products/arduino-nano.jpg"), "/images/products/arduino-nano.jpg");
  assert.equal(assetUrl("images/products/arduino-nano.jpg"), "/images/products/arduino-nano.jpg");
  assert.equal(assetUrl(""), "");
  assert.equal(assetUrl(null), "");
});
