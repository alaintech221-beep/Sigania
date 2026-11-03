import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Comportement applicatif natif : désactivation du menu contextuel (appui long / clic droit)
// sauf dans les champs de saisie pour préserver le copier/coller et la sélection
window.addEventListener('contextmenu', (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)
  ) {
    return;
  }
  e.preventDefault();
});

// Désactivation du glisser-déposer sur les images
window.addEventListener('dragstart', (e: DragEvent) => {
  const target = e.target as HTMLElement | null;
  if (target && target.tagName === 'IMG') {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);
