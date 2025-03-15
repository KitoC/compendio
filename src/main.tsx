
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Finding the root element
const rootElement = document.getElementById("root");

// Ensure we have a root element
if (!rootElement) {
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);
  
  createRoot(newRoot).render(<App />);
} else {
  createRoot(rootElement).render(<App />);
}
