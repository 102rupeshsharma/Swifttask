import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import { Login } from './pages/login/Login'
import { Signup } from "./pages/signup/Signup";
import { Home } from "./pages/home/Home"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Signup/>} />
        <Route path="/" element={<Home/>} />
      </Routes>
    </Router>
  )
}

export default App
