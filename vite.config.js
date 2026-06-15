import { defineConfig } from "vite";

// Op GitHub Pages wordt de site geserveerd onder /toptaal-rally/.
// Lokaal (dev/preview) blijft de base gewoon "/".
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/toptaal-rally/" : "/",
});
