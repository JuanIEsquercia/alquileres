import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, User, IdCard, Phone } from 'lucide-react'
import { supabase } from '../config/supabase'

function Inquilinos() {
  const [inquilinos, setInquilinos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingInquilino, setEditingInquilino] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchInquilinos()
  }, [])

  const fetchInquilinos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inquilinos')
        .select('id, nombre, apellido, dni, telefono, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setInquilinos(data || [])
    } catch (error) {
      console.error('Error fetching inquilinos:', error.message)
      alert('Error al cargar inquilinos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredInquilinos = inquilinos.filter(inquilino =>
    `${inquilino.nombre} ${inquilino.apellido} ${inquilino.dni} ${inquilino.telefono}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }
    
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido'
    }
    
    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido'
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener 7 u 8 dígitos'
    }
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      if (editingInquilino) {
        // Actualizar inquilino existente
        const { error } = await supabase
          .from('inquilinos')
          .update(formData)
          .eq('id', editingInquilino.id)

        if (error) throw error
      } else {
        // Crear nuevo inquilino
        const { error } = await supabase
          .from('inquilinos')
          .insert([formData])

        if (error) throw error
      }

      // Recargar datos
      await fetchInquilinos()
      resetForm()
      alert(editingInquilino ? 'Inquilino actualizado exitosamente' : 'Inquilino creado exitosamente')

    } catch (error) {
      console.error('Error saving inquilino:', error.message)
      
      // Manejar error de DNI duplicado
      if (error.message.includes('duplicate key value') || error.message.includes('unique constraint')) {
        alert('Error: Ya existe un inquilino con ese DNI')
      } else {
        alert('Error al guardar: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (inquilino) => {
    setEditingInquilino(inquilino)
    setFormData({
      nombre: inquilino.nombre,
      apellido: inquilino.apellido,
      dni: inquilino.dni,
      telefono: inquilino.telefono
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este inquilino?')) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('inquilinos')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchInquilinos()
      alert('Inquilino eliminado exitosamente')

    } catch (error) {
      console.error('Error deleting inquilino:', error.message)
      alert('Error al eliminar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingInquilino(null)
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      telefono: ''
    })
    setErrors({})
  }

  return (
    <div className="main-container" style={{ paddingTop: '100px' }}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h2 mb-1 fw-bold d-flex align-items-center">
                  <User className="me-3 text-primary" size={32} />
                  Gestión de Inquilinos
                </h1>
                <p className="text-muted mb-0">
                  Administra la información de tus inquilinos
                </p>
              </div>
              <div className="d-flex gap-2">
                <div className="badge bg-primary fs-6">
                  {inquilinos.length} registrados
                </div>
              </div>
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
                        placeholder="Buscar por nombre, apellido o DNI..."
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
                      Nuevo Inquilino
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
                      {editingInquilino ? 'Editar Inquilino' : 'Nuevo Inquilino'}
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
                        <label className="form-label">Nombre *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                          value={formData.nombre}
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                          placeholder="Ingrese el nombre"
                        />
                        {errors.nombre && (
                          <div className="invalid-feedback">{errors.nombre}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Apellido *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                          value={formData.apellido}
                          onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                          placeholder="Ingrese el apellido"
                        />
                        {errors.apellido && (
                          <div className="invalid-feedback">{errors.apellido}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">DNI *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <IdCard size={16} />
                          </span>
                          <input
                            type="text"
                            className={`form-control ${errors.dni ? 'is-invalid' : ''}`}
                            value={formData.dni}
                            onChange={(e) => setFormData({...formData, dni: e.target.value})}
                            placeholder="12345678"
                          />
                          {errors.dni && (
                            <div className="invalid-feedback">{errors.dni}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Teléfono *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <Phone size={16} />
                          </span>
                          <input
                            type="text"
                            className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                            value={formData.telefono}
                            onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                            placeholder="1123456789"
                          />
                          {errors.telefono && (
                            <div className="invalid-feedback">{errors.telefono}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary btn-custom"
                      >
                        {editingInquilino ? 'Actualizar' : 'Guardar'}
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
              {filteredInquilinos.length === 0 ? (
                <div className="card card-custom">
                  <div className="card-body text-center py-5">
                    <div className="empty-state">
                      <User className="empty-state-icon" size={64} />
                      <h5 className="mt-3">
                        {searchTerm ? 'No se encontraron inquilinos' : 'No hay inquilinos registrados'}
                      </h5>
                      <p className="text-muted">
                        {searchTerm 
                          ? 'Intenta con otros términos de búsqueda' 
                          : 'Comienza agregando tu primer inquilino'
                        }
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="btn btn-primary btn-custom mt-3"
                        >
                          <Plus size={18} className="me-2" />
                          Agregar Inquilino
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
                            <th>Inquilino</th>
                            <th>DNI</th>
                            <th>Teléfono</th>
                            <th width="120" className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInquilinos.map((inquilino) => (
                            <tr key={inquilino.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <User size={20} className="text-white" />
                                  </div>
                                  <div>
                                    <div className="fw-bold">{inquilino.nombre} {inquilino.apellido}</div>
                                    <small className="text-muted">Inquilino</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark">
                                  <IdCard size={14} className="me-1" />
                                  {inquilino.dni}
                                </span>
                              </td>
                              <td>
                                <span className="text-muted">
                                  <Phone size={14} className="me-1" />
                                  {inquilino.telefono}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex gap-1 justify-content-center">
                                  <button
                                    onClick={() => handleEdit(inquilino)}
                                    className="btn btn-outline-primary btn-sm"
                                    title="Editar"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(inquilino.id)}
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
                      {filteredInquilinos.map((inquilino) => (
                        <div key={inquilino.id} className="col-12">
                          <div className="card card-custom">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="d-flex align-items-center flex-grow-1">
                                  <div 
                                    className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '50px', height: '50px' }}
                                  >
                                    <User size={24} className="text-white" />
                                  </div>
                                  <div>
                                    <h6 className="mb-1 fw-bold">
                                      {inquilino.nombre} {inquilino.apellido}
                                    </h6>
                                    <div className="d-flex flex-column gap-1">
                                      <small className="text-muted">
                                        <IdCard size={12} className="me-1" />
                                        DNI: {inquilino.dni}
                                      </small>
                                      <small className="text-muted">
                                        <Phone size={12} className="me-1" />
                                        {inquilino.telefono}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex gap-1">
                                  <button
                                    onClick={() => handleEdit(inquilino)}
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(inquilino.id)}
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
                  <div className="col-md-4">
                    <div className="border-end border-2">
                      <h5 className="text-primary mb-1">{inquilinos.length}</h5>
                      <small className="text-muted">Total Registrados</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border-end border-2">
                      <h5 className="text-success mb-1">{filteredInquilinos.length}</h5>
                      <small className="text-muted">Mostrando</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <h5 className="text-info mb-1">
                      {searchTerm ? 'Filtrado' : 'Todos'}
                    </h5>
                    <small className="text-muted">Estado</small>
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

export default Inquilinos 