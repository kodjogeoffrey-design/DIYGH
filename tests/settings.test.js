import test from "node:test";
import assert from "node:assert/strict";
import {
  getSettings,
  saveSettings,
  resetSettings,
  DEFAULT_SETTINGS,
} from "../src/lib/settings.js";

test("getSettings returns defaults when nothing is saved", async () => {
  await resetSettings();
  const settings = getSettings();
  assert.equal(settings.tagline, DEFAULT_SETTINGS.tagline);
  assert.equal(settings.announcement, DEFAULT_SETTINGS.announcement);
});

test("legacy default tagline is migrated to the current default", async () => {
  await resetSettings();
  await saveSettings({ tagline: "Build Something. Learn Everything." });
  assert.equal(getSettings().tagline, DEFAULT_SETTINGS.tagline);
  await resetSettings();
});

test("saveSettings merges and persists a patch", async () => {
  await resetSettings();
  const next = await saveSettings({ tagline: "Wire it. Ship it." });
  assert.equal(next.tagline, "Wire it. Ship it.");
  assert.equal(next.announcement, DEFAULT_SETTINGS.announcement);
  assert.equal(getSettings().tagline, "Wire it. Ship it.");
  await resetSettings();
});

test("resetSettings restores defaults", async () => {
  await saveSettings({ tagline: "Temp", announcement: "Temp announcement" });
  const restored = await resetSettings();
  assert.deepEqual(restored, DEFAULT_SETTINGS);
  assert.equal(getSettings().tagline, DEFAULT_SETTINGS.tagline);
});
