import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import WordEditorPage from './pages/WordEditPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace/>}/>

        {/* Public Route */}
        <Route path="/login" element={<LoginPage/>}/>

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:id?"
          element={
            <ProtectedRoute>
              <WordEditorPage/>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;