import { test } from "node:test";
import assert from "node:assert/strict";
import { bellowsFoldPose, revealParts } from "../lib/vehicle-model.ts";

test("vehicle reveal removes the roof before the side panels", () => {
  assert.deepEqual(revealParts(0), { roof: 0, panels: 0 });
  assert.deepEqual(revealParts(0.4), { roof: 1, panels: 0 });
  assert.equal(revealParts(0.45).panels, 0);
  assert.deepEqual(revealParts(1), { roof: 1, panels: 1 });
});

test("bellows folds stay continuous between the fixed and bending modules", () => {
  const straightStart = bellowsFoldPose(0, 19, 0);
  const straightEnd = bellowsFoldPose(18, 19, 0);
  assert.deepEqual(straightStart, { x: -0.4, z: 0, yaw: 0 });
  assert.ok(Math.abs(straightEnd.x + 1.8) < 1e-9);

  const bent = Array.from({ length: 19 }, (_, i) => bellowsFoldPose(i, 19, 30));
  assert.deepEqual(bent[0], straightStart);
  assert.ok(bent.at(-1).z > 0, "rear edge follows the articulated module");
  assert.ok(bent.every((fold, i) => i === 0 || fold.yaw >= bent[i - 1].yaw), "rotation changes continuously");
  assert.deepEqual(bellowsFoldPose(18, 19, 90), bent.at(-1), "bend input is capped at the model's ±30° range");
});
