import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import { StudentAuthProvider } from './hooks/useStudentAuth'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <StudentAuthProvider>
      <App />
    </StudentAuthProvider>
  </AuthProvider>
);
