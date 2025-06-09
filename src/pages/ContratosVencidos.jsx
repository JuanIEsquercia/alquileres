import { useState, useEffect } from 'react'
import { AlertTriangle, Calendar, DollarSign, User, Home, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'

function ContratosVencidos() {
  const navigate = useNavigate()
  const [contratosVencidos, setContratosVencidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContratosVencidos()
  }, [])

  const fetchContratosVencidos = async () => {
    try {
      setLoading(true)
      
      // Obtener contratos vencidos (activo=true pero fecha_finalizacion < hoy)
      const { data, error } = await supabase
        .from('alquileres')
        .select(`
          id, precio, expensas, luz, agua, otros_importes, 
          fecha_finalizacion, inicio_contrato, plazo_meses,
          propiedades!inner(nombre, direccion),
          inquilinos!inner(nombre, apellido, telefono)
        `)
        .eq('activo', true)
        .lt('fecha_finalizacion', new Date().toISOString().split('T')[0])
        .order('fecha_finalizacion', { ascending: true })

      if (error) throw error
      
      setContratosVencidos(data || [])
    } catch (error) {
      console.error('Error fetching contratos vencidos:', error.message)
      alert('Error al cargar contratos vencidos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTotalMensual = (contrato) => {
    return contrato.precio + contrato.expensas + contrato.luz + contrato.agua + contrato.otros_importes
  }

  const getDiasVencido = (fechaFinalizacion) => {
    const hoy = new Date()
    const vencimiento = new Date(fechaFinalizacion)
    return Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24))
  }

  const finalizarContrato = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres finalizar este contrato? Esta acción liberará la propiedad.')) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('alquileres')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error

      await fetchContratosVencidos()
      alert('Contrato finalizado exitosamente. La propiedad ya está disponible.')

    } catch (error) {
      console.error('Error finalizando contrato:', error.message)
      alert('Error al finalizar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-container" style={{ paddingTop: '100px' }}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-outline-secondary btn-sm me-3"
                >
                  <ArrowLeft size={16} className="me-1" />
                  Volver
                </button>
                <h1 className="h2 mb-1 fw-bold d-flex align-items-center">
                  <AlertTriangle className="me-3 text-danger" size={32} />
                  Contratos Vencidos
                </h1>
                <p className="text-muted mb-0">
                  Contratos que requieren atención inmediata
                </p>
              </div>
              <div className="badge bg-danger fs-6">
                {contratosVencidos.length} contratos vencidos
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {contratosVencidos.length === 0 ? (
          <div className="row">
            <div className="col-12">
              <div className="card card-custom text-center py-5">
                <div className="card-body">
                  <AlertTriangle size={64} className="text-success mb-3" />
                  <h4 className="text-success">¡Excelente!</h4>
                  <p className="text-muted">No hay contratos vencidos que requieran atención.</p>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-primary"
                  >
                    Volver al Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {contratosVencidos.map((contrato) => {
              const diasVencido = getDiasVencido(contrato.fecha_finalizacion)
              return (
                <div key={contrato.id} className="col-lg-6 col-12">
                  <div className="card border-danger">
                    <div className="card-header bg-danger text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          <Home size={16} className="me-2" />
                          {contrato.propiedades.nombre}
                        </h6>
                        <span className="badge bg-dark">
                          Vencido hace {diasVencido} días
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <h6 className="text-muted">Inquilino</h6>
                          <p className="mb-1">
                            <User size={14} className="me-1" />
                            {contrato.inquilinos.nombre} {contrato.inquilinos.apellido}
                          </p>
                          <small className="text-muted">{contrato.inquilinos.telefono}</small>
                        </div>
                        <div className="col-md-6">
                          <h6 className="text-muted">Contrato</h6>
                          <p className="mb-1">
                            <Calendar size={14} className="me-1" />
                            {formatDate(contrato.inicio_contrato)} - {formatDate(contrato.fecha_finalizacion)}
                          </p>
                          <small className="text-muted">{contrato.plazo_meses} meses</small>
                        </div>
                        <div className="col-md-6">
                          <h6 className="text-muted">Dirección</h6>
                          <p className="mb-0 small">{contrato.propiedades.direccion}</p>
                        </div>
                        <div className="col-md-6">
                          <h6 className="text-muted">Monto Mensual</h6>
                          <p className="mb-0 fw-bold text-success">
                            <DollarSign size={14} className="me-1" />
                            {formatCurrency(getTotalMensual(contrato))}
                          </p>
                        </div>
                      </div>
                      
                      <hr />
                      
                      <div className="d-flex gap-2">
                        <button 
                          onClick={() => finalizarContrato(contrato.id)}
                          className="btn btn-danger btn-sm flex-fill"
                        >
                          Finalizar Contrato
                        </button>
                        <button 
                          onClick={() => navigate('/alquileres')}
                          className="btn btn-outline-primary btn-sm"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContratosVencidos 