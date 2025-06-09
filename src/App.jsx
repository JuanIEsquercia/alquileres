import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Componentes
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Inquilinos from './pages/Inquilinos'
import Propiedades from './pages/Propiedades'
import Alquileres from './pages/Alquileres'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inquilinos" element={<Inquilinos />} />
            <Route path="/propiedades" element={<Propiedades />} />
            <Route path="/alquileres" element={<Alquileres />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
