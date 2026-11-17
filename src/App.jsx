import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FeedbackProvider } from './components/ui/feedback';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FeedbackProvider>
          <AppRoutes />
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
