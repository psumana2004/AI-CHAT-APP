import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import StarredMessages from './pages/StarredMessages';
import AIPage from "./pages/AIPage";
import Test from "./pages/Test";

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem('token');
      setToken(currentToken);
    };

    // Check immediately
    checkToken();

    // Set up interval to check for token changes
    const interval = setInterval(checkToken, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/chat" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/starred-messages" element={token ? <StarredMessages /> : <Navigate to="/login" />} />
            <Route path="/ai" element={<AIPage />} />
            <Route path="/test" element={<Test />} />
          </Routes>
        </div>
        <Toaster position="top-center" />
      </Router>
    </ErrorBoundary>
  );
}

export default App;