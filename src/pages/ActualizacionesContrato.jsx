import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, DollarSign, User, Home, Save, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'

function ActualizacionesContrato() {
  const navigate = useNavigate()
  const [actualizacionesPendientes, setActualizacionesPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [actualizacionSeleccionada, setActualizacionSeleccionada] = useState(null)
  const [formData, setFormData] = useState({
    precio_nuevo: '',
    porcentaje_aumento: '',
    indice_aplicado: 'ICL',
    observaciones: ''
  })

  const indices = [
    { value: 'ICL', label: 'ICL - Índice de Contratos de Locación' },
    { value: 'IPC', label: 'IPC - Índice de Precios al Consumidor' },
    { value: 'MANUAL', label: 'Actualización Manual' }
  ]

  useEffect(() => {
    fetchActualizaciones()
  }, [])

  const fetchActualizaciones = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('get_proximas_actualizaciones', { meses_adelante: 6 })

      if (error) throw error
      setActualizacionesPendientes(data || [])
    } catch (error) {
      console.error('Error fetching actualizaciones:', error.message)
      // Si la función no existe, simular datos
      setActualizacionesPendientes([])
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

  const abrirModalActualizacion = (actualizacion) => {
    setActualizacionSeleccionada(actualizacion)
    const incrementoSugerido = Math.round(actualizacion.precio_actual * 1.25)
    
    setFormData({
      precio_nuevo: incrementoSugerido.toString(),
      porcentaje_aumento: '25.00',
      indice_aplicado: 'ICL',
      observaciones: `Actualización semestral - ${formatDate(actualizacion.fecha_proxima_actualizacion)}`
    })
    
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setActualizacionSeleccionada(null)
    setFormData({
      precio_nuevo: '',
      porcentaje_aumento: '',
      indice_aplicado: 'ICL',
      observaciones: ''
    })
  }

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center">
          <div className="spinner-border text-warning" role="status">
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
                  <TrendingUp className="me-3 text-warning" size={32} />
                  Actualizaciones de Contratos
                </h1>
                <p className="text-muted mb-0">
                  Gestiona las actualizaciones de precios cada 6 meses
                </p>
              </div>
              <div className="badge bg-warning fs-6 text-dark">
                {actualizacionesPendientes.length} pendientes
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="row">
          <div className="col-12">
            <div className="card card-custom">
              <div className="card-header bg-transparent border-0 pb-0">
                <h5 className="card-title mb-0">
                  <Calendar className="me-2" size={20} />
                  Actualizaciones Pendientes
                </h5>
              </div>
              <div className="card-body">
                {actualizacionesPendientes.length === 0 ? (
                  <div className="text-center py-5">
                    <TrendingUp size={64} className="text-success mb-3" />
                    <h5 className="text-success">¡Perfecto!</h5>
                    <p className="text-muted">No hay actualizaciones pendientes en los próximos 6 meses.</p>
                    <small className="text-muted">
                      Ejecuta primero el script SQL en Supabase para activar esta funcionalidad.
                    </small>
                  </div>
                ) : (
                  <div className="row g-3">
                    {actualizacionesPendientes.map((actualizacion) => (
                      <div key={actualizacion.alquiler_id} className="col-lg-6 col-12">
                        <div className="card border-warning h-100">
                          <div className="card-header bg-warning text-dark">
                            <h6 className="mb-0">
                              <Home size={16} className="me-2" />
                              {actualizacion.propiedad_direccion}
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                <h6 className="text-muted mb-1">Inquilino</h6>
                                <p className="mb-0">
                                  <User size={14} className="me-1" />
                                  {actualizacion.inquilino_nombre}
                                </p>
                              </div>
                              <div className="col-md-6">
                                <h6 className="text-muted mb-1">Precio Actual</h6>
                                <p className="mb-0 fw-bold text-primary">
                                  {formatCurrency(actualizacion.precio_actual)}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => abrirModalActualizacion(actualizacion)}
                              className="btn btn-warning btn-sm w-100"
                            >
                              <TrendingUp size={14} className="me-1" />
                              Aplicar Actualización
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Actualización */}
        {mostrarModal && actualizacionSeleccionada && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <TrendingUp className="me-2" size={20} />
                    Actualizar Contrato
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={cerrarModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Propiedad:</strong> {actualizacionSeleccionada.propiedad_direccion}
                    </div>
                    <div className="col-md-6">
                      <strong>Inquilino:</strong> {actualizacionSeleccionada.inquilino_nombre}
                    </div>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Precio Actual</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={formatCurrency(actualizacionSeleccionada.precio_actual)}
                        disabled
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Precio Nuevo *</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={formData.precio_nuevo}
                        onChange={(e) => setFormData(prev => ({...prev, precio_nuevo: e.target.value}))}
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Porcentaje de Aumento</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={formData.porcentaje_aumento}
                        onChange={(e) => setFormData(prev => ({...prev, porcentaje_aumento: e.target.value}))}
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Índice Aplicado</label>
                      <select 
                        className="form-select"
                        value={formData.indice_aplicado}
                        onChange={(e) => setFormData(prev => ({...prev, indice_aplicado: e.target.value}))}
                      >
                        {indices.map(indice => (
                          <option key={indice.value} value={indice.value}>
                            {indice.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Observaciones</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={formData.observaciones}
                        onChange={(e) => setFormData(prev => ({...prev, observaciones: e.target.value}))}
                        placeholder="Detalles sobre la actualización..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={cerrarModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={() => {
                      alert('Funcionalidad disponible después de ejecutar script SQL')
                      cerrarModal()
                    }}
                  >
                    <Save className="me-2" size={16} />
                    Aplicar Actualización
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActualizacionesContrato 