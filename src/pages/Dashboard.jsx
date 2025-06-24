import { useState, useEffect } from 'react'
import { Home, Users, FileText, AlertTriangle, TrendingUp, Calendar, DollarSign, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPropiedades: 0,
    propiedadesDisponibles: 0,
    totalInquilinos: 0,
    alquileresActivos: 0,
    ingresosMensuales: 0,
    alquileresPorVencer: 0
  })
  const [alquileresPorVencer, setAlquileresPorVencer] = useState([])
  const [propiedadesDisponibles, setPropiedadesDisponibles] = useState([])
  const [actualizacionesPendientes, setActualizacionesPendientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Obtener estadísticas con lógica de liberación automática
      const today = new Date().toISOString().split('T')[0]
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const [
        { data: estadisticasBasicas, error: statsError },
        { data: alquileresVencimientos, error: vencError },
        { data: propiedadesLibres, error: propError },
        { data: proximasActualizaciones, error: actualizacionesError }
      ] = await Promise.all([
        // Estadísticas con lógica actualizada
        supabase.rpc('get_estadisticas_dashboard'),
        // Alquileres por vencer (activos y no vencidos)
        supabase.from('alquileres').select(`
          id, precio, expensas, luz, agua, otros_importes, 
          fecha_finalizacion,
          propiedades!inner(nombre)
        `).eq('activo', true)
        .gte('fecha_finalizacion', today)
        .lte('fecha_finalizacion', thirtyDaysFromNow)
        .limit(10),
        // Propiedades realmente disponibles
        supabase.from('vista_propiedades_realmente_disponibles').select('id, nombre, direccion').limit(5),
        // Próximas actualizaciones de contratos (cada 6 meses)
        supabase.rpc('get_proximas_actualizaciones', { meses_adelante: 2 }).limit(5)
      ])

      if (statsError) throw statsError
      if (vencError) throw vencError
      if (propError) throw propError
      if (actualizacionesError) console.warn('Error cargando actualizaciones:', actualizacionesError)

      // Usar estadísticas con lógica de liberación automática
      const stats = estadisticasBasicas || {
        total_propiedades: 0,
        propiedades_ocupadas: 0,
        total_inquilinos: 0,
        total_alquileres_activos: 0,
        ingresos_mensual: 0,
        alquileres_por_vencer: 0
      }

      setStats({
        totalPropiedades: stats.total_propiedades,
        propiedadesDisponibles: stats.total_propiedades - stats.propiedades_ocupadas, // Ahora considera fechas!
        totalInquilinos: stats.total_inquilinos,
        alquileresActivos: stats.total_alquileres_activos, // Solo no vencidos
        ingresosMensuales: stats.ingresos_mensual, // Solo de contratos realmente activos
        alquileresPorVencer: stats.alquileres_por_vencer
      })

      // Formatear alquileres por vencer para mostrar
      const alquileresFormateados = (alquileresVencimientos || []).map(a => {
        const vencimiento = new Date(a.fecha_finalizacion)
        const todayDate = new Date()
        const diffDays = Math.ceil((vencimiento - todayDate) / (1000 * 60 * 60 * 24))
        
        return {
          propiedad: a.propiedades.nombre,
          inquilino: 'Inquilino', // Simplificado para reducir consultas
          fecha: a.fecha_finalizacion,
          monto: a.precio + a.expensas + a.luz + a.agua + a.otros_importes,
          urgente: diffDays <= 7
        }
      })

      // Propiedades realmente disponibles (liberadas automáticamente)
      const propiedadesDisponiblesFormateadas = (propiedadesLibres || []).map(p => ({
        nombre: p.nombre,
        direccion: p.direccion,
        precio: 0 // Se puede agregar precio sugerido después
      }))

      // Próximas actualizaciones de contratos (cada 6 meses)
      const actualizacionesFormateadas = (proximasActualizaciones || []).map(a => ({
        alquiler_id: a.alquiler_id,
        fecha_actualizacion: a.fecha_proxima_actualizacion,
        inquilino: a.inquilino_nombre,
        propiedad: a.propiedad_direccion,
        precio_actual: a.precio_actual,
        meses_desde_inicio: a.meses_desde_inicio,
        dias_restantes: Math.ceil((new Date(a.fecha_proxima_actualizacion) - new Date()) / (1000 * 60 * 60 * 24))
      }))

      setAlquileresPorVencer(alquileresFormateados)
      setPropiedadesDisponibles(propiedadesDisponiblesFormateadas)
      setActualizacionesPendientes(actualizacionesFormateadas)

    } catch (error) {
      console.error('Error fetching dashboard data:', error.message)
      alert('Error al cargar estadísticas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR')
  }

  const getIconColor = (color) => {
    const colors = {
      primary: '#0d6efd',
      success: '#198754',
      info: '#0dcaf0',
      warning: '#ffc107'
    }
    return colors[color] || colors.primary
  }

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Propiedades',
      value: stats.totalPropiedades,
      icon: Home,
      color: 'primary',
      subtitle: 'En cartera'
    },
    {
      title: 'Propiedades Disponibles',
      value: stats.propiedadesDisponibles,
      icon: FileText,
      color: 'success',
      subtitle: 'Libres para alquilar'
    },
    {
      title: 'Inquilinos Activos',
      value: stats.totalInquilinos,
      icon: Users,
      color: 'info',
      subtitle: 'Registrados'
    },
    {
      title: 'Ingresos Mensuales',
      value: formatCurrency(stats.ingresosMensuales),
      icon: DollarSign,
      color: 'warning',
      subtitle: 'Este mes'
    }
  ]

  return (
    <div className="main-container" style={{ paddingTop: '100px' }}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h2 mb-1 fw-bold">Dashboard</h1>
                <p className="text-muted mb-0">
                  <Calendar size={16} className="me-1" />
                  Última actualización: {new Date().toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary btn-custom">
                  <TrendingUp size={16} className="me-1" />
                  Reportes
                </button>
                <button className="btn btn-primary btn-custom">
                  <DollarSign size={16} className="me-1" />
                  Cobros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          {statCards.map((stat, index) => (
            <div key={index} className="col-lg-3 col-md-6 col-12">
              <div className="card-stat fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div 
                  className="stat-icon"
                  style={{ 
                    backgroundColor: `${getIconColor(stat.color)}20`,
                    color: getIconColor(stat.color)
                  }}
                >
                  <stat.icon size={24} />
                </div>
                <div className="stat-number">{stat.value}</div>
                <div className="stat-label">{stat.title}</div>
                <small className="text-muted">{stat.subtitle}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Content Row */}
        <div className="row g-4 mb-4">
          {/* Próximos Vencimientos */}
          <div className="col-lg-8 col-12">
            <div className="card card-custom h-100">
              <div className="card-header bg-transparent border-0 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0 d-flex align-items-center">
                    <AlertTriangle className="me-2 text-danger" size={20} />
                    Próximos Vencimientos
                  </h5>
                  <div className="d-flex gap-2 align-items-center">
                    <button 
                      onClick={() => navigate('/contratos-vencidos')}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Contratos Vencidos
                    </button>
                    <span className="badge bg-primary rounded-pill">
                      {alquileresPorVencer.length} pendientes
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {alquileresPorVencer.map((item, index) => (
                    <div key={index} className="col-12">
                      <div 
                        className={`alert ${item.urgente ? 'alert-danger' : 'alert-warning'} alert-custom mb-0`}
                        style={{ borderLeft: `4px solid ${item.urgente ? '#dc3545' : '#ffc107'}` }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="alert-heading mb-1">{item.propiedad}</h6>
                            <p className="mb-1">
                              <Users size={14} className="me-1" />
                              {item.inquilino}
                            </p>
                            <small className="text-muted">
                              <Calendar size={14} className="me-1" />
                              Vence: {formatDate(item.fecha)}
                            </small>
                          </div>
                          <div className="text-end">
                            <div className="h5 mb-0 fw-bold">
                              {formatCurrency(item.monto)}
                            </div>
                            <small className={`badge ${item.urgente ? 'bg-danger' : 'bg-warning'} text-dark`}>
                              {item.urgente ? 'Urgente' : 'Próximo'}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <button 
                    onClick={() => navigate('/alquileres')}
                    className="btn btn-outline-primary btn-custom"
                  >
                    Ver todos los vencimientos
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Propiedades Disponibles */}
          <div className="col-lg-4 col-12">
            <div className="card card-custom h-100">
              <div className="card-header bg-transparent border-0 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0 d-flex align-items-center">
                    <Home className="me-2 text-success" size={20} />
                    Disponibles
                  </h5>
                  <span className="badge bg-success rounded-pill">
                    {propiedadesDisponibles.length} libres
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {propiedadesDisponibles.map((propiedad, index) => (
                    <div key={index} className="col-12">
                      <div className="card border-success" style={{ borderWidth: '2px' }}>
                        <div className="card-body p-3">
                          <h6 className="card-title mb-2 d-flex align-items-center">
                            <Home size={16} className="me-2 text-success" />
                            {propiedad.nombre}
                          </h6>
                          <p className="card-text small text-muted mb-2">
                            {propiedad.caracteristicas}
                          </p>
                          <p className="card-text small mb-2">
                            📍 {propiedad.direccion}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="badge bg-success">Disponible</span>
                            <strong className="text-success">
                              {formatCurrency(propiedad.precio)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <button 
                    onClick={() => navigate('/propiedades')}
                    className="btn btn-outline-success btn-custom"
                  >
                    Ver todas las propiedades
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actualizaciones de Contratos */}
        {actualizacionesPendientes.length > 0 && (
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="card card-custom">
                <div className="card-header bg-transparent border-0 pb-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0 d-flex align-items-center">
                      <TrendingUp className="me-2 text-warning" size={20} />
                      Actualizaciones de Contratos Pendientes
                    </h5>
                    <span className="badge bg-warning rounded-pill text-dark">
                      {actualizacionesPendientes.length} contratos
                    </span>
                  </div>
                  <p className="text-muted small mb-0 mt-2">
                    Contratos que requieren actualización de precios cada 6 meses
                  </p>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {actualizacionesPendientes.map((actualizacion, index) => (
                      <div key={actualizacion.alquiler_id} className="col-lg-6 col-12">
                        <div className="alert alert-warning alert-custom mb-0" style={{ borderLeft: '4px solid #ffc107' }}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="alert-heading mb-1">{actualizacion.propiedad}</h6>
                              <p className="mb-1">
                                <Users size={14} className="me-1" />
                                {actualizacion.inquilino}
                              </p>
                              <small className="text-muted">
                                <Calendar size={14} className="me-1" />
                                Actualizar: {formatDate(actualizacion.fecha_actualizacion)}
                                <span className="ms-2">
                                  ({actualizacion.meses_desde_inicio} meses de contrato)
                                </span>
                              </small>
                            </div>
                            <div className="text-end">
                              <div className="h6 mb-0 fw-bold text-warning">
                                {formatCurrency(actualizacion.precio_actual)}
                              </div>
                              <small className="badge bg-warning text-dark">
                                {actualizacion.dias_restantes > 0 
                                  ? `En ${actualizacion.dias_restantes} días`
                                  : 'Vencida'
                                }
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <button 
                      onClick={() => navigate('/actualizaciones')}
                      className="btn btn-outline-warning btn-custom"
                    >
                      <TrendingUp className="me-2" size={16} />
                      Gestionar Actualizaciones
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card card-custom">
              <div className="card-body">
                <h5 className="card-title mb-3">🚀 Acciones Rápidas</h5>
                <div className="row g-3">
                  <div className="col-lg-3 col-md-6 col-12">
                    <button 
                      onClick={() => navigate('/inquilinos')}
                      className="btn btn-outline-primary btn-custom w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3"
                    >
                      <Users size={24} className="mb-2" />
                      <span>Nuevo Inquilino</span>
                    </button>
                  </div>
                  <div className="col-lg-3 col-md-6 col-12">
                    <button 
                      onClick={() => navigate('/propiedades')}
                      className="btn btn-outline-success btn-custom w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3"
                    >
                      <Home size={24} className="mb-2" />
                      <span>Nueva Propiedad</span>
                    </button>
                  </div>
                  <div className="col-lg-3 col-md-6 col-12">
                    <button 
                      onClick={() => navigate('/alquileres')}
                      className="btn btn-outline-info btn-custom w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3"
                    >
                      <TrendingUp size={24} className="mb-2" />
                      <span>Nuevo Alquiler</span>
                    </button>
                  </div>
                  <div className="col-lg-3 col-md-6 col-12">
                    <button 
                      onClick={() => navigate('/alquileres')}
                      className="btn btn-outline-warning btn-custom w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3"
                      title="Funcionalidad en desarrollo"
                    >
                      <DollarSign size={24} className="mb-2" />
                      <span>Registrar Pago</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 