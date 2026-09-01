import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initCapacitorPush } from './lib/capacitor-push'

createRoot(document.getElementById("root")!).render(<App />);

// Init push natif Android (no-op sur web)
initCapacitorPush().catch(() => {});
