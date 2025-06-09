import { NavLink } from 'react-router-dom'
import { Home, Users, Building, FileText } from 'lucide-react'

function Navbar() {
  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/inquilinos', icon: Users, label: 'Inquilinos' },
    { to: '/propiedades', icon: Building, label: 'Propiedades' },
    { to: '/alquileres', icon: FileText, label: 'Alquileres' },
  ]

  return (
    <nav className="navbar navbar-expand-lg navbar-custom fixed-top">
      <div className="container-fluid">
        {/* Brand */}
        <NavLink className="navbar-brand d-flex align-items-center" to="/">
          <Home className="me-2" size={24} />
          Sistema de Alquileres
        </NavLink>

        {/* Mobile toggle */}
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          style={{ boxShadow: 'none' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {navItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon size={18} className="me-2" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 