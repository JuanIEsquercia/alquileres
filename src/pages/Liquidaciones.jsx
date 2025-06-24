import { useState, useEffect } from 'react'
import { FileText, Download, Calendar, DollarSign, Users, Home, Send } from 'lucide-react'
import { supabase } from '../config/supabase'
import { 
  generarLiquidacionesMasivas, 
  descargarLiquidacionPDF,
  obtenerAlquileresVencimientoMensual 
} from '../components/LiquidacionPDF'

function Liquidaciones() {
  const [alquileres, setAlquileres] = useState([])
  const [alquileresVencimiento, setAlquileresVencimiento] = useState([])
  const [loading, setLoading] = useState(true)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1)
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear())

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ]

  useEffect(() => {
    fetchAlquileres()
  }, [])

  useEffect(() => {
    if (alquileres.length > 0) {
      filtrarAlquileresVencimiento()
    }
  }, [alquileres, mesSeleccionado, añoSeleccionado])

  const fetchAlquileres = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('alquileres')
        .select(`
          id, precio, expensas, luz, agua, otros_importes,
          inicio_contrato, fecha_finalizacion, plazo_meses, activo,
          propiedades!inner(id, nombre, direccion),
          inquilinos!inner(id, nombre, apellido, dni, telefono)
        `)
        .eq('activo', true)
        .gte('fecha_finalizacion', new Date().toISOString().split('T')[0])
        .order('fecha_finalizacion', { ascending: true })

      if (error) throw error
      
      setAlquileres(data || [])
    } catch (error) {
      console.error('Error fetching alquileres:', error.message)
      alert('Error al cargar alquileres: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filtrarAlquileresVencimiento = () => {
    const alquileresDelMes = obtenerAlquileresVencimientoMensual(
      alquileres, 
      mesSeleccionado, 
      añoSeleccionado
    )
    setAlquileresVencimiento(alquileresDelMes)
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

  const getTotalMensual = (alquiler) => {
    return alquiler.precio + alquiler.expensas + alquiler.luz + alquiler.agua + alquiler.otros_importes
  }

  const generarLiquidacionIndividual = async (alquiler) => {
    try {
      setGenerandoPDF(true)
      
      descargarLiquidacionPDF(
        alquiler,
        alquiler.inquilinos,
        alquiler.propiedades,
        mesSeleccionado,
        añoSeleccionado
      )

      alert('Liquidación generada exitosamente')
    } catch (error) {
      console.error('Error generando liquidación:', error)
      alert('Error al generar liquidación: ' + error.message)
    } finally {
      setGenerandoPDF(false)
    }
  }

  const generarLiquidacionesMasivasHandler = async () => {
    if (alquileresVencimiento.length === 0) {
      alert('No hay alquileres para el período seleccionado')
      return
    }

    try {
      setGenerandoPDF(true)
      
      const liquidaciones = await generarLiquidacionesMasivas(
        alquileresVencimiento,
        mesSeleccionado,
        añoSeleccionado
      )

      // Descargar todas las liquidaciones
      liquidaciones.forEach(liquidacion => {
        setTimeout(() => {
          liquidacion.doc.save(liquidacion.filename)
        }, 100)
      })

      alert(`${liquidaciones.length} liquidaciones generadas exitosamente`)
    } catch (error) {
      console.error('Error generando liquidaciones masivas:', error)
      alert('Error al generar liquidaciones: ' + error.message)
    } finally {
      setGenerandoPDF(false)
    }
  }

  const getMesLabel = () => {
    const mes = meses.find(m => m.value === mesSeleccionado)
    return mes ? mes.label : ''
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
                  Liquidaciones de Alquiler
                </h1>
                <p className="text-muted mb-0">
                  Genera liquidaciones PDF para enviar a inquilinos - Vencimiento mensual día 10
                </p>
              </div>
              <div className="badge bg-primary fs-6">
                {alquileresVencimiento.length} liquidaciones pendientes
              </div>
            </div>
          </div>
        </div>

        {/* Selector de período */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card card-custom">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <Calendar className="me-2" size={20} />
                  Seleccionar Período de Liquidación
                </h5>
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label">Mes</label>
                    <select 
                      className="form-select"
                      value={mesSeleccionado}
                      onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                    >
                      {meses.map(mes => (
                        <option key={mes.value} value={mes.value}>
                          {mes.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Año</label>
                    <select 
                      className="form-select"
                      value={añoSeleccionado}
                      onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
                    >
                      {[2024, 2025, 2026, 2027].map(año => (
                        <option key={año} value={año}>{año}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex gap-2">
                      <button
                        onClick={generarLiquidacionesMasivasHandler}
                        disabled={generandoPDF || alquileresVencimiento.length === 0}
                        className="btn btn-primary"
                      >
                        {generandoPDF ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Download className="me-2" size={16} />
                            Generar Todas las Liquidaciones
                          </>
                        )}
                      </button>
                      <div className="alert alert-info mb-0 py-2 px-3 d-flex align-items-center">
                        <Calendar size={16} className="me-2" />
                        Vencimiento: 10/{mesSeleccionado.toString().padStart(2, '0')}/{añoSeleccionado}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
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
              <div className="stat-number">{alquileresVencimiento.length}</div>
              <div className="stat-label">Liquidaciones</div>
              <small className="text-muted">{getMesLabel()} {añoSeleccionado}</small>
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
              <div className="stat-number">
                {formatCurrency(
                  alquileresVencimiento.reduce((total, a) => total + getTotalMensual(a), 0)
                )}
              </div>
              <div className="stat-label">Total a Facturar</div>
              <small className="text-muted">Mes seleccionado</small>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card-stat fade-in" style={{ animationDelay: '0.2s' }}>
              <div 
                className="stat-icon"
                style={{ 
                  backgroundColor: '#fd7e1420',
                  color: '#fd7e14'
                }}
              >
                <Users size={24} />
              </div>
              <div className="stat-number">{alquileresVencimiento.length}</div>
              <div className="stat-label">Inquilinos</div>
              <small className="text-muted">A facturar</small>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card-stat fade-in" style={{ animationDelay: '0.3s' }}>
              <div 
                className="stat-icon"
                style={{ 
                  backgroundColor: '#6f42c120',
                  color: '#6f42c1'
                }}
              >
                <Home size={24} />
              </div>
              <div className="stat-number">{alquileresVencimiento.length}</div>
              <div className="stat-label">Propiedades</div>
              <small className="text-muted">Con cobros</small>
            </div>
          </div>
        </div>

        {/* Lista de liquidaciones */}
        <div className="row">
          <div className="col-12">
            <div className="card card-custom">
              <div className="card-header bg-transparent border-0 pb-0">
                <h5 className="card-title mb-0">
                  Liquidaciones para {getMesLabel()} {añoSeleccionado}
                </h5>
              </div>
              <div className="card-body">
                {alquileresVencimiento.length === 0 ? (
                  <div className="text-center py-5">
                    <FileText size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">No hay liquidaciones para el período seleccionado</h5>
                    <p className="text-muted">Selecciona otro mes o verifica que haya contratos activos.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {alquileresVencimiento.map((alquiler) => (
                      <div key={alquiler.id} className="col-lg-6 col-12">
                        <div className="card border-primary h-100">
                          <div className="card-header bg-primary text-white">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0">
                                <Home size={16} className="me-2" />
                                {alquiler.propiedades.nombre || alquiler.propiedades.direccion}
                              </h6>
                              <span className="badge bg-light text-dark">
                                Vence 10/{mesSeleccionado.toString().padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                          <div className="card-body">
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                <h6 className="text-muted mb-1">Inquilino</h6>
                                <p className="mb-0">
                                  <Users size={14} className="me-1" />
                                  {alquiler.inquilinos.nombre} {alquiler.inquilinos.apellido}
                                </p>
                                <small className="text-muted">{alquiler.inquilinos.telefono}</small>
                              </div>
                              <div className="col-md-6">
                                <h6 className="text-muted mb-1">Dirección</h6>
                                <p className="mb-0 small">{alquiler.propiedades.direccion}</p>
                              </div>
                              <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-muted">Total mensual:</span>
                                  <span className="h5 mb-0 text-success fw-bold">
                                    {formatCurrency(getTotalMensual(alquiler))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => generarLiquidacionIndividual(alquiler)}
                                disabled={generandoPDF}
                                className="btn btn-primary btn-sm flex-fill"
                              >
                                <Download size={14} className="me-1" />
                                Generar PDF
                              </button>
                              <button
                                className="btn btn-outline-success btn-sm"
                                title="Funcionalidad en desarrollo"
                                disabled
                              >
                                <Send size={14} className="me-1" />
                                Enviar
                              </button>
                            </div>
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
      </div>
    </div>
  )
}

export default Liquidaciones 