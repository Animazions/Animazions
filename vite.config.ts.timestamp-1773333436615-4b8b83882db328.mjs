// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "/home/project";
var safePublicDir = path.resolve(__vite_injected_original_dirname, ".public-safe");
function prepareSafePublic() {
  if (!fs.existsSync(safePublicDir)) fs.mkdirSync(safePublicDir, { recursive: true });
  const publicDir = path.resolve(__vite_injected_original_dirname, "public");
  for (const file of fs.readdirSync(publicDir)) {
    if (file.includes(" copy")) continue;
    const src = path.join(publicDir, file);
    const dest = path.join(safePublicDir, file);
    try {
      fs.copyFileSync(src, dest);
    } catch {
    }
  }
}
prepareSafePublic();
var vite_config_default = defineConfig({
  publicDir: safePublicDir,
  plugins: [react()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  resolve: {
    dedupe: ["react", "react-dom", "ethers"],
    alias: {
      "@tanstack/react-query": path.resolve(
        __vite_injected_original_dirname,
        "node_modules/@thirdweb-dev/react-core/node_modules/@tanstack/react-query"
      )
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react", "@ffmpeg/ffmpeg", "@ffmpeg/util"],
    include: [
      "@thirdweb-dev/react",
      "@thirdweb-dev/react-core"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmNvbnN0IHNhZmVQdWJsaWNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLnB1YmxpYy1zYWZlJyk7XG5cbmZ1bmN0aW9uIHByZXBhcmVTYWZlUHVibGljKCkge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoc2FmZVB1YmxpY0RpcikpIGZzLm1rZGlyU3luYyhzYWZlUHVibGljRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgY29uc3QgcHVibGljRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3B1YmxpYycpO1xuICBmb3IgKGNvbnN0IGZpbGUgb2YgZnMucmVhZGRpclN5bmMocHVibGljRGlyKSkge1xuICAgIGlmIChmaWxlLmluY2x1ZGVzKCcgY29weScpKSBjb250aW51ZTtcbiAgICBjb25zdCBzcmMgPSBwYXRoLmpvaW4ocHVibGljRGlyLCBmaWxlKTtcbiAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHNhZmVQdWJsaWNEaXIsIGZpbGUpO1xuICAgIHRyeSB7IGZzLmNvcHlGaWxlU3luYyhzcmMsIGRlc3QpOyB9IGNhdGNoIHsgLyogc2tpcCAqLyB9XG4gIH1cbn1cblxucHJlcGFyZVNhZmVQdWJsaWMoKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcHVibGljRGlyOiBzYWZlUHVibGljRGlyLFxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDcm9zcy1PcmlnaW4tT3BlbmVyLVBvbGljeSc6ICdzYW1lLW9yaWdpbicsXG4gICAgICAnQ3Jvc3MtT3JpZ2luLUVtYmVkZGVyLVBvbGljeSc6ICdyZXF1aXJlLWNvcnAnLFxuICAgIH0sXG4gIH0sXG4gIHByZXZpZXc6IHtcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ3Jvc3MtT3JpZ2luLU9wZW5lci1Qb2xpY3knOiAnc2FtZS1vcmlnaW4nLFxuICAgICAgJ0Nyb3NzLU9yaWdpbi1FbWJlZGRlci1Qb2xpY3knOiAncmVxdWlyZS1jb3JwJyxcbiAgICB9LFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgZGVkdXBlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdldGhlcnMnXSxcbiAgICBhbGlhczoge1xuICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeSc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAnbm9kZV9tb2R1bGVzL0B0aGlyZHdlYi1kZXYvcmVhY3QtY29yZS9ub2RlX21vZHVsZXMvQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5J1xuICAgICAgKSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCcsICdAZmZtcGVnL2ZmbXBlZycsICdAZmZtcGVnL3V0aWwnXSxcbiAgICBpbmNsdWRlOiBbXG4gICAgICAnQHRoaXJkd2ViLWRldi9yZWFjdCcsXG4gICAgICAnQHRoaXJkd2ViLWRldi9yZWFjdC1jb3JlJyxcbiAgICBdLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxRQUFRO0FBSGYsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTSxnQkFBZ0IsS0FBSyxRQUFRLGtDQUFXLGNBQWM7QUFFNUQsU0FBUyxvQkFBb0I7QUFDM0IsTUFBSSxDQUFDLEdBQUcsV0FBVyxhQUFhLEVBQUcsSUFBRyxVQUFVLGVBQWUsRUFBRSxXQUFXLEtBQUssQ0FBQztBQUNsRixRQUFNLFlBQVksS0FBSyxRQUFRLGtDQUFXLFFBQVE7QUFDbEQsYUFBVyxRQUFRLEdBQUcsWUFBWSxTQUFTLEdBQUc7QUFDNUMsUUFBSSxLQUFLLFNBQVMsT0FBTyxFQUFHO0FBQzVCLFVBQU0sTUFBTSxLQUFLLEtBQUssV0FBVyxJQUFJO0FBQ3JDLFVBQU0sT0FBTyxLQUFLLEtBQUssZUFBZSxJQUFJO0FBQzFDLFFBQUk7QUFBRSxTQUFHLGFBQWEsS0FBSyxJQUFJO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBYTtBQUFBLEVBQ3pEO0FBQ0Y7QUFFQSxrQkFBa0I7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsV0FBVztBQUFBLEVBQ1gsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLDhCQUE4QjtBQUFBLE1BQzlCLGdDQUFnQztBQUFBLElBQ2xDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsU0FBUztBQUFBLE1BQ1AsOEJBQThCO0FBQUEsTUFDOUIsZ0NBQWdDO0FBQUEsSUFDbEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxRQUFRLENBQUMsU0FBUyxhQUFhLFFBQVE7QUFBQSxJQUN2QyxPQUFPO0FBQUEsTUFDTCx5QkFBeUIsS0FBSztBQUFBLFFBQzVCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGdCQUFnQixrQkFBa0IsY0FBYztBQUFBLElBQzFELFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
