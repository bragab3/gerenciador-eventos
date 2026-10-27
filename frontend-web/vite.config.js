import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A porta 5173 está liberada no CORS do backend. Se estiver ocupada, o Vite avisa em vez de trocar de porta.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
