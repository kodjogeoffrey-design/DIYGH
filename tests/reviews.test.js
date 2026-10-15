import test from "node:test";
import assert from "node:assert/strict";
import {
  addReview,
  listReviews,
  averageLocalRating,
  clearReviews,
  deleteReview,
} from "../src/lib/reviews.js";

const PRODUCT = "test-product-reviews";

test("reviews start empty", async () => {
  await clearReviews();
  assert.deepEqual(await listReviews(PRODUCT), []);
  assert.equal(await averageLocalRating(PRODUCT), null);
});

test("addReview stores a review and computes the average", async () => {
  await clearReviews();
  const first = await addReview(PRODUCT, {
    name: "Ama",
    rating: 5,
    comment: "Solid sensor, wires worked first try.",
  });
  await addReview(PRODUCT, {
    name: "Kofi",
    rating: 4,
    comment: "Good value for the price.",
  });

  const list = await listReviews(PRODUCT);
  assert.equal(list.length, 2);
  assert.equal(list[0].id, first.id);
  assert.equal(list[0].name, "Ama");
  assert.equal(list[1].rating, 4);
  assert.equal(await averageLocalRating(PRODUCT), 4.5);
  await clearReviews();
});

test("addReview rejects empty name or comment", async () => {
  await clearReviews();
  await assert.rejects(() => addReview(PRODUCT, { name: "", rating: 5, comment: "hi" }));
  await assert.rejects(() => addReview(PRODUCT, { name: "Ada", rating: 5, comment: "   " }));
  await clearReviews();
});

test("rating is clamped to 1–5", async () => {
  await clearReviews();
  const high = await addReview(PRODUCT, { name: "Max", rating: 99, comment: "Amazing" });
  const low = await addReview(PRODUCT, { name: "Min", rating: -3, comment: "Rough" });
  assert.equal(high.rating, 5);
  assert.equal(low.rating, 1);
  await clearReviews();
});

test("deleteReview removes a single review", async () => {
  await clearReviews();
  const keep = await addReview(PRODUCT, { name: "Kofi", rating: 5, comment: "Solid" });
  const drop = await addReview(PRODUCT, { name: "Ama", rating: 2, comment: "Loose wires" });
  await deleteReview(drop.id);
  const list = await listReviews(PRODUCT);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, keep.id);
  await clearReviews();
});
