import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, MapPin, Building, Home } from 'lucide-react'
import { supabase } from '../config/supabase'

function Propiedades() {
  const [propiedades, setPropiedades] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingPropiedad, setEditingPropiedad] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchPropiedades()
  }, [])

  const fetchPropiedades = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('propiedades')
        .select('id, nombre, direccion, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setPropiedades(data || [])
    } catch (error) {
      console.error('Error fetching propiedades:', error.message)
      alert('Error al cargar propiedades: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredPropiedades = propiedades.filter(propiedad =>
    `${propiedad.nombre} ${propiedad.direccion}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }
    
    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      if (editingPropiedad) {
        // Actualizar propiedad existente
        const { error } = await supabase
          .from('propiedades')
          .update(formData)
          .eq('id', editingPropiedad.id)

        if (error) throw error
      } else {
        // Crear nueva propiedad
        const { error } = await supabase
          .from('propiedades')
          .insert([formData])

        if (error) throw error
      }

      // Recargar datos
      await fetchPropiedades()
      resetForm()
      alert(editingPropiedad ? 'Propiedad actualizada exitosamente' : 'Propiedad creada exitosamente')

    } catch (error) {
      console.error('Error saving propiedad:', error.message)
      alert('Error al guardar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (propiedad) => {
    setEditingPropiedad(propiedad)
    setFormData({
      nombre: propiedad.nombre,
      direccion: propiedad.direccion
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('propiedades')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchPropiedades()
      alert('Propiedad eliminada exitosamente')

    } catch (error) {
      console.error('Error deleting propiedad:', error.message)
      alert('Error al eliminar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingPropiedad(null)
    setFormData({
      nombre: '',
      direccion: ''
    })
    setErrors({})
  }

  const getEstadoBadge = (estado) => {
    return estado === 'disponible' 
      ? <span className="badge bg-success">Disponible</span>
      : <span className="badge bg-warning text-dark">Ocupada</span>
  }

  const propiedadesDisponibles = propiedades.filter(p => !p.ocupada).length
  const propiedadesOcupadas = propiedades.filter(p => p.ocupada).length

  return (
    <div className="main-container" style={{ paddingTop: '100px' }}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h2 mb-1 fw-bold d-flex align-items-center">
                  <Building className="me-3 text-success" size={32} />
                  Gestión de Propiedades
                </h1>
                <p className="text-muted mb-0">
                  Administra tu cartera de propiedades inmobiliarias
                </p>
              </div>
              <div className="d-flex gap-2">
                <div className="badge bg-success fs-6">
                  {propiedadesDisponibles} disponibles
                </div>
                <div className="badge bg-warning fs-6 text-dark">
                  {propiedadesOcupadas} ocupadas
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
                  backgroundColor: '#19875420',
                  color: '#198754'
                }}
              >
                <Building size={24} />
              </div>
              <div className="stat-number">{propiedades.length}</div>
              <div className="stat-label">Total Propiedades</div>
              <small className="text-muted">En cartera</small>
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
                <Home size={24} />
              </div>
              <div className="stat-number">{propiedadesDisponibles}</div>
              <div className="stat-label">Disponibles</div>
              <small className="text-muted">Para alquilar</small>
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
                <Building size={24} />
              </div>
              <div className="stat-number">{propiedadesOcupadas}</div>
              <div className="stat-label">Ocupadas</div>
              <small className="text-muted">Alquiladas</small>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card-stat fade-in" style={{ animationDelay: '0.3s' }}>
              <div 
                className="stat-icon"
                style={{ 
                  backgroundColor: '#0d6efd20',
                  color: '#0d6efd'
                }}
              >
                <MapPin size={24} />
              </div>
              <div className="stat-number">{new Set(propiedades.map(p => p.direccion.split(',')[1]?.trim())).size}</div>
              <div className="stat-label">Ubicaciones</div>
              <small className="text-muted">Diferentes zonas</small>
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
                        placeholder="Buscar propiedades por nombre o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 text-end">
                    <button
                      onClick={() => setShowForm(true)}
                      className="btn btn-success btn-custom"
                    >
                      <Plus size={18} className="me-2" />
                      Nueva Propiedad
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
                      {editingPropiedad ? 'Editar Propiedad' : 'Nueva Propiedad'}
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
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Nombre de la Propiedad *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <Building size={16} />
                          </span>
                          <input
                            type="text"
                            className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                            value={formData.nombre}
                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                            placeholder="Ej: Departamento 2A, Casa Los Pinos"
                          />
                          {errors.nombre && (
                            <div className="invalid-feedback">{errors.nombre}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Dirección Completa *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <MapPin size={16} />
                          </span>
                          <input
                            type="text"
                            className={`form-control ${errors.direccion ? 'is-invalid' : ''}`}
                            value={formData.direccion}
                            onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                            placeholder="Ej: Av. Corrientes 1234, CABA"
                          />
                          {errors.direccion && (
                            <div className="invalid-feedback">{errors.direccion}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="btn btn-success btn-custom"
                      >
                        {editingPropiedad ? 'Actualizar' : 'Guardar'}
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
              {filteredPropiedades.length === 0 ? (
                <div className="card card-custom">
                  <div className="card-body text-center py-5">
                    <div className="empty-state">
                      <Building className="empty-state-icon" size={64} />
                      <h5 className="mt-3">
                        {searchTerm ? 'No se encontraron propiedades' : 'No hay propiedades registradas'}
                      </h5>
                      <p className="text-muted">
                        {searchTerm 
                          ? 'Intenta con otros términos de búsqueda' 
                          : 'Comienza agregando tu primera propiedad'
                        }
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="btn btn-success btn-custom mt-3"
                        >
                          <Plus size={18} className="me-2" />
                          Agregar Propiedad
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
                            <th>Propiedad</th>
                            <th>Dirección</th>
                            <th>Estado</th>
                            <th width="120" className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPropiedades.map((propiedad) => (
                            <tr key={propiedad.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div 
                                    className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                      propiedad.estado === 'disponible' ? 'bg-success' : 'bg-warning'
                                    }`}
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <Building size={20} className="text-white" />
                                  </div>
                                  <div>
                                    <div className="fw-bold">{propiedad.nombre}</div>
                                    <small className="text-muted">Propiedad</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-muted">
                                  <MapPin size={14} className="me-1" />
                                  {propiedad.direccion}
                                </span>
                              </td>
                              <td>
                                {getEstadoBadge(propiedad.estado)}
                              </td>
                              <td>
                                <div className="d-flex gap-1 justify-content-center">
                                  <button
                                    onClick={() => handleEdit(propiedad)}
                                    className="btn btn-outline-primary btn-sm"
                                    title="Editar"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(propiedad.id)}
                                    className="btn btn-outline-danger btn-sm"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="d-lg-none">
                    <div className="row g-3">
                      {filteredPropiedades.map((propiedad) => (
                        <div key={propiedad.id} className="col-12">
                          <div className="card card-custom">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="d-flex align-items-center flex-grow-1">
                                  <div 
                                    className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                      propiedad.estado === 'disponible' ? 'bg-success' : 'bg-warning'
                                    }`}
                                    style={{ width: '50px', height: '50px' }}
                                  >
                                    <Building size={24} className="text-white" />
                                  </div>
                                  <div>
                                    <h6 className="mb-1 fw-bold">{propiedad.nombre}</h6>
                                    <div className="d-flex flex-column gap-1">
                                      <small className="text-muted">
                                        <MapPin size={12} className="me-1" />
                                        {propiedad.direccion}
                                      </small>
                                      <div>
                                        {getEstadoBadge(propiedad.estado)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex gap-1">
                                  <button
                                    onClick={() => handleEdit(propiedad)}
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(propiedad.id)}
                                    className="btn btn-outline-danger btn-sm"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                      <h5 className="text-success mb-1">{propiedades.length}</h5>
                      <small className="text-muted">Total Propiedades</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border-end border-2">
                      <h5 className="text-success mb-1">{propiedadesDisponibles}</h5>
                      <small className="text-muted">Disponibles</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border-end border-2">
                      <h5 className="text-warning mb-1">{propiedadesOcupadas}</h5>
                      <small className="text-muted">Ocupadas</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <h5 className="text-info mb-1">{filteredPropiedades.length}</h5>
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

export default Propiedades 