import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, Calendar, DollarSign, User, Building, Home, FileText, Clock, MapPin, TrendingUp } from 'lucide-react'
import { supabase } from '../config/supabase'

function Alquileres() {
  const [alquileres, setAlquileres] = useState([])
  const [propiedades, setPropiedades] = useState([])
  const [inquilinos, setInquilinos] = useState([])
  const [indices, setIndices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingAlquiler, setEditingAlquiler] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    propiedad_id: '',
    inquilino_id: '',
    inicio_contrato: '',
    plazo_meses: 24,
    indice_id: '',
    precio: '',
    plazo_actualizacion_meses: 12,
    expensas: '',
    luz: '',
    agua: '',
    otros_importes: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Fetch todos los datos en paralelo
      const [
        { data: alquileresData, error: alquileresError },
        { data: propiedadesData, error: propiedadesError },
        { data: inquilinosData, error: inquilinosError },
        { data: indicesData, error: indicesError }
      ] = await Promise.all([
        supabase.from('alquileres').select(`
          id, propiedad_id, inquilino_id, inicio_contrato, plazo_meses, 
          fecha_finalizacion, indice_id, precio, plazo_actualizacion_meses,
          expensas, luz, agua, otros_importes, activo, created_at
        `).order('created_at', { ascending: false }),
        supabase.from('propiedades').select('id, nombre').order('nombre'),
        supabase.from('inquilinos').select('id, nombre, apellido').order('nombre'),
        supabase.from('indices_actualizacion').select('id, nombre').eq('activo', true).order('nombre')
      ])

      if (alquileresError) throw alquileresError
      if (propiedadesError) throw propiedadesError
      if (inquilinosError) throw inquilinosError
      if (indicesError) throw indicesError

      setAlquileres(alquileresData || [])
      setPropiedades(propiedadesData || [])
      setInquilinos(inquilinosData || [])
      setIndices(indicesData || [])
      
    } catch (error) {
      console.error('Error fetching data:', error.message)
      alert('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getPropiedadNombre = (id) => {
    const prop = propiedades.find(p => p.id === id)
    return prop ? prop.nombre : 'N/A'
  }

  const getInquilinoNombre = (id) => {
    const inq = inquilinos.find(i => i.id === id)
    return inq ? `${inq.nombre} ${inq.apellido}` : 'N/A'
  }

  const getIndiceNombre = (id) => {
    const ind = indices.find(i => i.id === id)
    return ind ? ind.nombre : 'N/A'
  }

  const calcularFechaFinalizacion = (inicio, plazoMeses) => {
    if (!inicio || !plazoMeses) return ''
    const fecha = new Date(inicio)
    fecha.setMonth(fecha.getMonth() + parseInt(plazoMeses))
    return fecha.toISOString().split('T')[0]
  }

  const filteredAlquileres = alquileres.filter(alquiler => {
    const propiedadNombre = getPropiedadNombre(alquiler.propiedad_id)
    const inquilinoNombre = getInquilinoNombre(alquiler.inquilino_id)
    return `${propiedadNombre} ${inquilinoNombre}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  })

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.propiedad_id) {
      newErrors.propiedad_id = 'Seleccione una propiedad'
    }
    
    if (!formData.inquilino_id) {
      newErrors.inquilino_id = 'Seleccione un inquilino'
    }
    
    if (!formData.inicio_contrato) {
      newErrors.inicio_contrato = 'La fecha de inicio es requerida'
    }
    
    if (!formData.plazo_meses || formData.plazo_meses < 1) {
      newErrors.plazo_meses = 'El plazo debe ser mayor a 0'
    }

    if (!formData.indice_id) {
      newErrors.indice_id = 'Seleccione un índice'
    }
    
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      const submitData = {
        propiedad_id: formData.propiedad_id,
        inquilino_id: formData.inquilino_id,
        inicio_contrato: formData.inicio_contrato,
        plazo_meses: parseInt(formData.plazo_meses),
        indice_id: formData.indice_id,
        precio: parseFloat(formData.precio),
        plazo_actualizacion_meses: parseInt(formData.plazo_actualizacion_meses),
        expensas: parseFloat(formData.expensas || 0),
        luz: parseFloat(formData.luz || 0),
        agua: parseFloat(formData.agua || 0),
        otros_importes: parseFloat(formData.otros_importes || 0),
        activo: true
      }

      if (editingAlquiler) {
        // Actualizar alquiler existente
        const { error } = await supabase
          .from('alquileres')
          .update(submitData)
          .eq('id', editingAlquiler.id)

        if (error) throw error
      } else {
        // Crear nuevo alquiler
        const { error } = await supabase
          .from('alquileres')
          .insert([submitData])

        if (error) throw error
      }

      // Recargar datos
      await fetchAllData()
      resetForm()
      alert(editingAlquiler ? 'Alquiler actualizado exitosamente' : 'Alquiler creado exitosamente')

    } catch (error) {
      console.error('Error saving alquiler:', error.message)
      
      // Manejar errores específicos
      if (error.message.includes('unique constraint') || error.message.includes('alquileres_propiedad_activo')) {
        alert('Error: Esta propiedad ya tiene un alquiler activo')
      } else {
        alert('Error al guardar: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (alquiler) => {
    setEditingAlquiler(alquiler)
    setFormData({
      propiedad_id: alquiler.propiedad_id,
      inquilino_id: alquiler.inquilino_id,
      inicio_contrato: alquiler.inicio_contrato,
      plazo_meses: alquiler.plazo_meses,
      indice_id: alquiler.indice_id,
      precio: alquiler.precio.toString(),
      plazo_actualizacion_meses: alquiler.plazo_actualizacion_meses || 12,
      expensas: alquiler.expensas.toString(),
      luz: alquiler.luz.toString(),
      agua: alquiler.agua.toString(),
      otros_importes: alquiler.otros_importes.toString()
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este alquiler?')) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('alquileres')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchAllData()
      alert('Alquiler eliminado exitosamente')

    } catch (error) {
      console.error('Error deleting alquiler:', error.message)
      alert('Error al eliminar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingAlquiler(null)
    setFormData({
      propiedad_id: '',
      inquilino_id: '',
      inicio_contrato: '',
      plazo_meses: 24,
      indice_id: '',
      precio: '',
      plazo_actualizacion_meses: 12,
      expensas: '',
      luz: '',
      agua: '',
      otros_importes: ''
    })
    setErrors({})
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

  const getTotalMensual = (alquiler) => {
    return alquiler.precio + alquiler.expensas + alquiler.luz + alquiler.agua + alquiler.otros_importes
  }

  const getEstadoBadge = (alquiler) => {
    const today = new Date()
    const vencimiento = new Date(alquiler.fecha_finalizacion)
    const diffDays = Math.ceil((vencimiento - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return <span className="badge bg-danger">Vencido</span>
    } else if (diffDays <= 30) {
      return <span className="badge bg-warning text-dark">Por vencer</span>
    } else {
      return <span className="badge bg-success">Activo</span>
    }
  }

  // Estadísticas
  const alquileresActivos = alquileres.filter(a => {
    const today = new Date()
    const vencimiento = new Date(a.fecha_finalizacion)
    return vencimiento >= today && a.activo
  }).length

  const alquileresVencidos = alquileres.filter(a => {
    const today = new Date()
    const vencimiento = new Date(a.fecha_finalizacion)
    return vencimiento < today || !a.activo
  }).length

  const porVencer = alquileres.filter(a => {
    const today = new Date()
    const vencimiento = new Date(a.fecha_finalizacion)
    const diffDays = Math.ceil((vencimiento - today) / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 30 && a.activo
  }).length

  const ingresosMensuales = alquileres.reduce((total, alquiler) => {
    const today = new Date()
    const vencimiento = new Date(alquiler.fecha_finalizacion)
    return (vencimiento >= today && alquiler.activo) ? total + getTotalMensual(alquiler) : total
  }, 0)

  return (
    <div className="main-container" style={{ paddingTop: '100px' }}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h2 mb-1 fw-bold d-flex align-items-center">
                  <FileText className="me-3 text-primary" size={32} />
                  Gestión de Alquileres
                </h1>
                <p className="text-muted mb-0">
                  Administra contratos de alquiler y seguimiento de inquilinos
                </p>
              </div>
              <div className="d-flex gap-2">
                <div className="badge bg-success fs-6">
                  {alquileresActivos} activos
                </div>
                <div className="badge bg-warning fs-6 text-dark">
                  {porVencer} por vencer
                </div>
                <div className="badge bg-danger fs-6">
                  {alquileresVencidos} vencidos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card-stat fade-in">
              <div 
                className="stat-icon"
                style={{ 
                  backgroundColor: '#0d6efd20',
                  color: '#0d6efd'
                }}
              >
                <FileText size={24} />
              </div>
              <div className="stat-number">{alquileres.length}</div>
              <div className="stat-label">Total Contratos</div>
              <small className="text-muted">En gestión</small>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card-stat fade-in" style={{ animationDelay: '0.1s' }}>
              <div 
                className="stat-icon"
                style={{ 
                  backgroundColor: '#19875420',
                  color: '#198754'
                }}
              >
                <DollarSign size={24} />
              </div>
              <div className="stat-number">{formatCurrency(ingresosMensuales)}</div>
              <div className="stat-label">Ingresos Mensuales</div>
              <small className="text-muted">De contratos activos</small>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card-stat fade-in" style={{ animationDelay: '0.2s' }}>
              <div 
                className="stat-icon"
                style={{ 
                  backgroundColor: '#ffc10720',
                  color: '#ffc107'
                }}
              >
                <Clock size={24} />
              </div>
              <div className="stat-number">{porVencer}</div>
              <div className="stat-label">Por Vencer</div>
              <small className="text-muted">Próximos 30 días</small>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card-stat fade-in" style={{ animationDelay: '0.3s' }}>
              <div 
                className="stat-icon"
                style={{ 
                  backgroundColor: '#dc354520',
                  color: '#dc3545'
                }}
              >
                <Calendar size={24} />
              </div>
              <div className="stat-number">{alquileresVencidos}</div>
              <div className="stat-label">Vencidos</div>
              <small className="text-muted">Requieren atención</small>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card card-custom">
              <div className="card-body">
                <div className="row g-3 align-items-center">
                  <div className="col-lg-6">
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <Search size={18} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Buscar por propiedad, inquilino o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 text-end">
                    <button
                      onClick={() => setShowForm(true)}
                      className="btn btn-primary btn-custom"
                    >
                      <Plus size={18} className="me-2" />
                      Nuevo Contrato
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {showForm ? (
          /* Form */
          <div className="row">
            <div className="col-12">
              <div className="card card-custom">
                <div className="card-header bg-transparent border-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">
                      {editingAlquiler ? 'Editar Contrato de Alquiler' : 'Nuevo Contrato de Alquiler'}
                    </h5>
                    <button
                      onClick={resetForm}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Sección 1: Selección de Propiedad e Inquilino */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h6 className="fw-bold text-primary mb-3">
                          <Building size={18} className="me-2" />
                          Información del Contrato
                        </h6>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <label className="form-label">Propiedad *</label>
                        <select
                          className={`form-select ${errors.propiedad_id ? 'is-invalid' : ''}`}
                          value={formData.propiedad_id}
                          onChange={(e) => setFormData({...formData, propiedad_id: e.target.value})}
                        >
                          <option value="">Seleccionar propiedad...</option>
                          {propiedades.map(propiedad => (
                            <option key={propiedad.id} value={propiedad.id}>
                              {propiedad.nombre} - {propiedad.direccion}
                            </option>
                          ))}
                        </select>
                        {errors.propiedad_id && (
                          <div className="invalid-feedback">{errors.propiedad_id}</div>
                        )}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Inquilino *</label>
                        <select
                          className={`form-select ${errors.inquilino_id ? 'is-invalid' : ''}`}
                          value={formData.inquilino_id}
                          onChange={(e) => setFormData({...formData, inquilino_id: e.target.value})}
                        >
                          <option value="">Seleccionar inquilino...</option>
                          {inquilinos.map(inquilino => (
                            <option key={inquilino.id} value={inquilino.id}>
                              {inquilino.nombre} {inquilino.apellido}
                            </option>
                          ))}
                        </select>
                        {errors.inquilino_id && (
                          <div className="invalid-feedback">{errors.inquilino_id}</div>
                        )}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Índice de Actualización *</label>
                        <select
                          className={`form-select ${errors.indice_id ? 'is-invalid' : ''}`}
                          value={formData.indice_id}
                          onChange={(e) => setFormData({...formData, indice_id: e.target.value})}
                        >
                          <option value="">Seleccionar índice...</option>
                          {indices.map(indice => (
                            <option key={indice.id} value={indice.id}>
                              {indice.nombre}
                            </option>
                          ))}
                        </select>
                        {errors.indice_id && (
                          <div className="invalid-feedback">{errors.indice_id}</div>
                        )}
                      </div>
                    </div>

                    {/* Sección 2: Fechas del Contrato */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h6 className="fw-bold text-success mb-3">
                          <Calendar size={18} className="me-2" />
                          Período del Contrato
                        </h6>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <label className="form-label">Fecha de Inicio *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <Calendar size={16} />
                          </span>
                          <input
                            type="date"
                            className={`form-control ${errors.inicio_contrato ? 'is-invalid' : ''}`}
                            value={formData.inicio_contrato}
                            onChange={(e) => setFormData({...formData, inicio_contrato: e.target.value})}
                          />
                          {errors.inicio_contrato && (
                            <div className="invalid-feedback">{errors.inicio_contrato}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Plazo (meses) *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <Clock size={16} />
                          </span>
                          <input
                            type="number"
                            className={`form-control ${errors.plazo_meses ? 'is-invalid' : ''}`}
                            value={formData.plazo_meses}
                            onChange={(e) => setFormData({...formData, plazo_meses: e.target.value})}
                            min="1"
                            placeholder="24"
                          />
                          {errors.plazo_meses && (
                            <div className="invalid-feedback">{errors.plazo_meses}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Fecha de Finalización</label>
                        <input
                          type="text"
                          value={formData.inicio_contrato && formData.plazo_meses ? 
                            formatDate(calcularFechaFinalizacion(formData.inicio_contrato, formData.plazo_meses)) : ''
                          }
                          readOnly
                          className="form-control bg-light text-muted"
                          placeholder="Se calcula automáticamente"
                        />
                      </div>
                    </div>

                    {/* Mostrar duración calculada */}
                    {formData.inicio_contrato && formData.plazo_meses && (
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="alert alert-info d-flex align-items-center">
                            <Clock size={18} className="me-2" />
                            <span>
                              Duración del contrato: {formData.plazo_meses} meses 
                              (Desde {formatDate(formData.inicio_contrato)} hasta {formatDate(calcularFechaFinalizacion(formData.inicio_contrato, formData.plazo_meses))})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sección 3: Información Financiera */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h6 className="fw-bold text-warning mb-3">
                          <DollarSign size={18} className="me-2" />
                          Importes Mensuales (ARS)
                        </h6>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <label className="form-label">Precio del Alquiler *</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className={`form-control ${errors.precio ? 'is-invalid' : ''}`}
                            value={formData.precio}
                            onChange={(e) => setFormData({...formData, precio: e.target.value})}
                            placeholder="450000"
                            min="0"
                            step="1000"
                          />
                          {errors.precio && (
                            <div className="invalid-feedback">{errors.precio}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Plazo de Actualización</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <TrendingUp size={16} />
                          </span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.plazo_actualizacion_meses}
                            onChange={(e) => setFormData({...formData, plazo_actualizacion_meses: e.target.value})}
                            placeholder="12"
                            min="1"
                            max="60"
                          />
                          <span className="input-group-text">meses</span>
                        </div>
                        <small className="form-text text-muted">Cada cuántos meses se actualizará el precio</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Expensas</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.expensas}
                            onChange={(e) => setFormData({...formData, expensas: e.target.value})}
                            placeholder="45000"
                            min="0"
                            step="1000"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Luz</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.luz}
                            onChange={(e) => setFormData({...formData, luz: e.target.value})}
                            placeholder="0"
                            min="0"
                            step="1000"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label">Agua</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.agua}
                            onChange={(e) => setFormData({...formData, agua: e.target.value})}
                            placeholder="0"
                            min="0"
                            step="1000"
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Otros Importes</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.otros_importes}
                            onChange={(e) => setFormData({...formData, otros_importes: e.target.value})}
                            placeholder="0"
                            min="0"
                            step="1000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mostrar cálculos financieros */}
                    {(formData.precio || formData.expensas || formData.luz || formData.agua || formData.otros_importes) && (
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="card bg-light">
                            <div className="card-body">
                              <h6 className="fw-bold text-primary mb-3">Resumen Financiero</h6>
                              <div className="row">
                                <div className="col-md-3">
                                  <div className="text-center">
                                    <div className="h5 text-success mb-1">
                                      {formatCurrency(parseFloat(formData.precio || 0))}
                                    </div>
                                    <small className="text-muted">Precio del Alquiler</small>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="text-center">
                                    <div className="h5 text-info mb-1">
                                      {formatCurrency(
                                        (parseFloat(formData.expensas || 0) + 
                                         parseFloat(formData.luz || 0) + 
                                         parseFloat(formData.agua || 0) + 
                                         parseFloat(formData.otros_importes || 0))
                                      )}
                                    </div>
                                    <small className="text-muted">Servicios</small>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="text-center">
                                    <div className="h5 text-warning mb-1">
                                      {formatCurrency(
                                        parseFloat(formData.precio || 0) + 
                                        parseFloat(formData.expensas || 0) + 
                                        parseFloat(formData.luz || 0) + 
                                        parseFloat(formData.agua || 0) + 
                                        parseFloat(formData.otros_importes || 0)
                                      )}
                                    </div>
                                    <small className="text-muted">Total Mensual</small>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="text-center">
                                    <div className="h5 text-primary mb-1">
                                      {formData.plazo_meses ? formatCurrency(
                                        (parseFloat(formData.precio || 0) + 
                                         parseFloat(formData.expensas || 0) + 
                                         parseFloat(formData.luz || 0) + 
                                         parseFloat(formData.agua || 0) + 
                                         parseFloat(formData.otros_importes || 0)) * 
                                        parseInt(formData.plazo_meses)
                                      ) : formatCurrency(0)}
                                    </div>
                                    <small className="text-muted">Total Contrato</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary btn-custom"
                      >
                        {editingAlquiler ? 'Actualizar Contrato' : 'Crear Contrato'}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="btn btn-outline-secondary btn-custom"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* List */
          <div className="row">
            <div className="col-12">
              {filteredAlquileres.length === 0 ? (
                <div className="card card-custom">
                  <div className="card-body text-center py-5">
                    <div className="empty-state">
                      <FileText className="empty-state-icon" size={64} />
                      <h5 className="mt-3">
                        {searchTerm ? 'No se encontraron contratos' : 'No hay contratos registrados'}
                      </h5>
                      <p className="text-muted">
                        {searchTerm 
                          ? 'Intenta con otros términos de búsqueda' 
                          : 'Comienza creando tu primer contrato de alquiler'
                        }
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="btn btn-primary btn-custom mt-3"
                        >
                          <Plus size={18} className="me-2" />
                          Crear Contrato
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="d-none d-lg-block">
                    <div className="table-custom">
                      <table className="table table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Propiedad / Inquilino</th>
                            <th>Período</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th width="120" className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAlquileres.map((alquiler) => {
                            return (
                              <tr key={alquiler.id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div 
                                      className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-primary"
                                      style={{ width: '45px', height: '45px' }}
                                    >
                                      <Home size={22} className="text-white" />
                                    </div>
                                    <div>
                                      <div className="fw-bold">{getPropiedadNombre(alquiler.propiedad_id)}</div>
                                      <small className="text-muted">
                                        <User size={12} className="me-1" />
                                        {getInquilinoNombre(alquiler.inquilino_id)}
                                      </small>
                                      <br />
                                      <small className="text-muted">
                                        <span className="badge bg-info text-dark">{getIndiceNombre(alquiler.indice_id)}</span>
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <div className="fw-bold">
                                      {formatDate(alquiler.inicio_contrato)}
                                    </div>
                                    <small className="text-muted">al</small>
                                    <div className="fw-bold">
                                      {formatDate(alquiler.fecha_finalizacion)}
                                    </div>
                                    <small className="text-muted">
                                      {alquiler.plazo_meses} meses
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <div className="fw-bold text-success">
                                    {formatCurrency(getTotalMensual(alquiler))}
                                  </div>
                                  <small className="text-muted">mensual</small>
                                  <br />
                                  <small className="text-muted">
                                    Alquiler: {formatCurrency(alquiler.precio)}
                                  </small>
                                </td>
                                <td>
                                  {getEstadoBadge(alquiler)}
                                </td>
                                <td>
                                  <div className="d-flex gap-1 justify-content-center">
                                    <button
                                      onClick={() => handleEdit(alquiler)}
                                      className="btn btn-outline-primary btn-sm"
                                      title="Editar"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(alquiler.id)}
                                      className="btn btn-outline-danger btn-sm"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="d-lg-none">
                    <div className="row g-3">
                      {filteredAlquileres.map((alquiler) => {
                        return (
                          <div key={alquiler.id} className="col-12">
                            <div className="card card-custom">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div className="d-flex align-items-center flex-grow-1">
                                    <div 
                                      className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-primary"
                                      style={{ width: '50px', height: '50px' }}
                                    >
                                      <Home size={24} className="text-white" />
                                    </div>
                                    <div>
                                      <h6 className="mb-1 fw-bold">{getPropiedadNombre(alquiler.propiedad_id)}</h6>
                                      <small className="text-muted d-block">
                                        <User size={12} className="me-1" />
                                        {getInquilinoNombre(alquiler.inquilino_id)}
                                      </small>
                                      <small className="text-muted">
                                        <span className="badge bg-info text-dark">{getIndiceNombre(alquiler.indice_id)}</span>
                                      </small>
                                    </div>
                                  </div>
                                  <div>
                                    {getEstadoBadge(alquiler)}
                                  </div>
                                </div>

                                <div className="row g-2 mb-3">
                                  <div className="col-6">
                                    <small className="text-muted d-block">Período</small>
                                    <div className="fw-bold small">
                                      {formatDate(alquiler.inicio_contrato)}
                                    </div>
                                    <div className="fw-bold small">
                                      {formatDate(alquiler.fecha_finalizacion)}
                                    </div>
                                    <small className="text-muted">{alquiler.plazo_meses} meses</small>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted d-block">Total Mensual</small>
                                    <div className="fw-bold text-success">
                                      {formatCurrency(getTotalMensual(alquiler))}
                                    </div>
                                    <small className="text-muted">
                                      Alquiler: {formatCurrency(alquiler.precio)}
                                    </small>
                                  </div>
                                </div>

                                {(alquiler.expensas > 0 || alquiler.luz > 0 || alquiler.agua > 0 || alquiler.otros_importes > 0) && (
                                  <div className="mb-3">
                                    <small className="text-muted d-block">Desglose:</small>
                                    <div className="d-flex flex-wrap gap-1">
                                      {alquiler.expensas > 0 && <small className="badge bg-light text-dark">Exp: {formatCurrency(alquiler.expensas)}</small>}
                                      {alquiler.luz > 0 && <small className="badge bg-light text-dark">Luz: {formatCurrency(alquiler.luz)}</small>}
                                      {alquiler.agua > 0 && <small className="badge bg-light text-dark">Agua: {formatCurrency(alquiler.agua)}</small>}
                                      {alquiler.otros_importes > 0 && <small className="badge bg-light text-dark">Otros: {formatCurrency(alquiler.otros_importes)}</small>}
                                    </div>
                                  </div>
                                )}

                                <div className="d-flex gap-1">
                                  <button
                                    onClick={() => handleEdit(alquiler)}
                                    className="btn btn-outline-primary btn-sm flex-fill"
                                  >
                                    <Edit size={14} className="me-1" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDelete(alquiler.id)}
                                    className="btn btn-outline-danger btn-sm"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card card-custom">
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-3">
                    <div className="border-end border-2">
                      <h5 className="text-primary mb-1">{alquileres.length}</h5>
                      <small className="text-muted">Total Contratos</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border-end border-2">
                      <h5 className="text-success mb-1">{formatCurrency(ingresosMensuales)}</h5>
                      <small className="text-muted">Ingresos Mensuales</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border-end border-2">
                      <h5 className="text-warning mb-1">{porVencer}</h5>
                      <small className="text-muted">Por Vencer</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <h5 className="text-info mb-1">{filteredAlquileres.length}</h5>
                    <small className="text-muted">Mostrando</small>
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

export default Alquileres 