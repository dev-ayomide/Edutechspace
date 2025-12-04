import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from './component/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';
import LoadingPage from './pages/LoadingPage';

// Add global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent default error handling that causes blank screens
  event.preventDefault();
  return true;
}, true);

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default error handling
  event.preventDefault();
});

// Prevent React from unmounting on errors
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out React hydration warnings that can cause blank screens
  if (args[0] && typeof args[0] === 'string' && args[0].includes('hydration')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingPage />}>
          <AuthProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthProvider>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);