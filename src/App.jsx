import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Propiedades from './pages/Propiedades'
import Inquilinos from './pages/Inquilinos'
import Alquileres from './pages/Alquileres'
import Liquidaciones from './pages/Liquidaciones'
import ContratosVencidos from './pages/ContratosVencidos'
import ActualizacionesContrato from './pages/ActualizacionesContrato'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/propiedades" element={<Propiedades />} />
            <Route path="/inquilinos" element={<Inquilinos />} />
            <Route path="/alquileres" element={<Alquileres />} />
            <Route path="/liquidaciones" element={<Liquidaciones />} />
            <Route path="/contratos-vencidos" element={<ContratosVencidos />} />
            <Route path="/actualizaciones" element={<ActualizacionesContrato />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
