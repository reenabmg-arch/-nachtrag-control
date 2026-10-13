import { getStore } from "../src/server/store";
// Store initialization inserts or upgrades unused draft runs without touching active/history runs.
const store = getStore();
await store.transact((s) => {
  console.log(
    `NACHTRAG version ${s.runs.test.version}: Test and Live runs present. Existing active data preserved.`,
  );
});
await store.close();
