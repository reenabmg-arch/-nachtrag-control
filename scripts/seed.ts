import { getStore } from "../src/server/store";
// Store initialization inserts the two versioned demo runs exactly once.
const store = getStore();
await store.transact((s) => {
  console.log(
    `DEMO version ${s.runs.test.version}: Test and Live runs present. Existing data preserved.`,
  );
});
await store.close();
