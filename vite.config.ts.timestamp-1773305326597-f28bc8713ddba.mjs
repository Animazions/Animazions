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
    exclude: ["lucide-react"],
    include: [
      "@thirdweb-dev/react",
      "@thirdweb-dev/react-core"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmNvbnN0IHNhZmVQdWJsaWNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLnB1YmxpYy1zYWZlJyk7XG5cbmZ1bmN0aW9uIHByZXBhcmVTYWZlUHVibGljKCkge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoc2FmZVB1YmxpY0RpcikpIGZzLm1rZGlyU3luYyhzYWZlUHVibGljRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgY29uc3QgcHVibGljRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3B1YmxpYycpO1xuICBmb3IgKGNvbnN0IGZpbGUgb2YgZnMucmVhZGRpclN5bmMocHVibGljRGlyKSkge1xuICAgIGlmIChmaWxlLmluY2x1ZGVzKCcgY29weScpKSBjb250aW51ZTtcbiAgICBjb25zdCBzcmMgPSBwYXRoLmpvaW4ocHVibGljRGlyLCBmaWxlKTtcbiAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHNhZmVQdWJsaWNEaXIsIGZpbGUpO1xuICAgIHRyeSB7IGZzLmNvcHlGaWxlU3luYyhzcmMsIGRlc3QpOyB9IGNhdGNoIHsgLyogc2tpcCAqLyB9XG4gIH1cbn1cblxucHJlcGFyZVNhZmVQdWJsaWMoKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcHVibGljRGlyOiBzYWZlUHVibGljRGlyLFxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBkZWR1cGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ2V0aGVycyddLFxuICAgIGFsaWFzOiB7XG4gICAgICAnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JzogcGF0aC5yZXNvbHZlKFxuICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICdub2RlX21vZHVsZXMvQHRoaXJkd2ViLWRldi9yZWFjdC1jb3JlL25vZGVfbW9kdWxlcy9AdGFuc3RhY2svcmVhY3QtcXVlcnknXG4gICAgICApLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gICAgaW5jbHVkZTogW1xuICAgICAgJ0B0aGlyZHdlYi1kZXYvcmVhY3QnLFxuICAgICAgJ0B0aGlyZHdlYi1kZXYvcmVhY3QtY29yZScsXG4gICAgXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUhmLElBQU0sbUNBQW1DO0FBS3pDLElBQU0sZ0JBQWdCLEtBQUssUUFBUSxrQ0FBVyxjQUFjO0FBRTVELFNBQVMsb0JBQW9CO0FBQzNCLE1BQUksQ0FBQyxHQUFHLFdBQVcsYUFBYSxFQUFHLElBQUcsVUFBVSxlQUFlLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFDbEYsUUFBTSxZQUFZLEtBQUssUUFBUSxrQ0FBVyxRQUFRO0FBQ2xELGFBQVcsUUFBUSxHQUFHLFlBQVksU0FBUyxHQUFHO0FBQzVDLFFBQUksS0FBSyxTQUFTLE9BQU8sRUFBRztBQUM1QixVQUFNLE1BQU0sS0FBSyxLQUFLLFdBQVcsSUFBSTtBQUNyQyxVQUFNLE9BQU8sS0FBSyxLQUFLLGVBQWUsSUFBSTtBQUMxQyxRQUFJO0FBQUUsU0FBRyxhQUFhLEtBQUssSUFBSTtBQUFBLElBQUcsUUFBUTtBQUFBLElBQWE7QUFBQSxFQUN6RDtBQUNGO0FBRUEsa0JBQWtCO0FBRWxCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFdBQVc7QUFBQSxFQUNYLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxRQUFRLENBQUMsU0FBUyxhQUFhLFFBQVE7QUFBQSxJQUN2QyxPQUFPO0FBQUEsTUFDTCx5QkFBeUIsS0FBSztBQUFBLFFBQzVCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxJQUN4QixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
