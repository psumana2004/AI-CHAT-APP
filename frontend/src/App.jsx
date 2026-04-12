import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import AIPage from "./pages/AIPage";

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-white">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/chat" />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
          <Route path="/ai" element={<AIPage />} />
        </Routes>
      </div>
      <Toaster position="top-center" />
    </Router>
  );
}

export default App;