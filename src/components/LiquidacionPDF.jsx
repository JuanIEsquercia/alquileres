import jsPDF from 'jspdf'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from "../config/supabase"

export const generarLiquidacionPDF = (alquiler, inquilino, propiedad, mesLiquidacion, año) => {
  const doc = new jsPDF()
  
  // Configuración básica
  const fechaVencimiento = `10/${mesLiquidacion.toString().padStart(2, '0')}/${año}`
  const fechaEmision = format(new Date(), 'dd/MM/yyyy', { locale: es })
  const periodoLiquidacion = format(new Date(año, mesLiquidacion - 1), 'MMMM yyyy', { locale: es })
  
  // Encabezado
  doc.setFillColor(41, 128, 185)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('LIQUIDACIÓN DE ALQUILER', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${periodoLiquidacion.toUpperCase()}`, 105, 30, { align: 'center' })
  
  // Datos del inquilino
  doc.setTextColor(44, 62, 80)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL INQUILINO', 20, 55)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nombre: ${inquilino.nombre} ${inquilino.apellido}`, 20, 65)
  doc.text(`DNI: ${inquilino.dni || 'N/A'}`, 20, 72)
  doc.text(`Teléfono: ${inquilino.telefono}`, 20, 79)
  
  // Datos de la propiedad
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DE LA PROPIEDAD', 20, 95)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dirección: ${propiedad.direccion}`, 20, 105)
  doc.text(`Nombre: ${propiedad.nombre || 'Propiedad'}`, 20, 112)

  // Datos del contrato
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL CONTRATO', 20, 130)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Inicio: ${format(new Date(alquiler.inicio_contrato), 'dd/MM/yyyy')}`, 20, 140)
  doc.text(`Fin: ${format(new Date(alquiler.fecha_finalizacion), 'dd/MM/yyyy')}`, 20, 147)
  doc.text(`Plazo: ${alquiler.plazo_meses} meses`, 20, 154)
  
  // Detalle de liquidación
  doc.setFillColor(41, 128, 185)
  doc.rect(20, 170, 170, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE LA LIQUIDACIÓN', 105, 176, { align: 'center' })
  
  // Conceptos
  doc.setTextColor(44, 62, 80)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  let yPos = 190
  const lineHeight = 7
  
  doc.text('CONCEPTO', 25, yPos)
  doc.text('IMPORTE', 160, yPos)
  yPos += lineHeight
  
  doc.line(20, yPos, 190, yPos)
  yPos += lineHeight
  
  doc.text('Alquiler', 25, yPos)
  doc.text(`$${alquiler.precio.toLocaleString('es-AR')}`, 160, yPos)
  yPos += lineHeight
  
  doc.text('Expensas', 25, yPos)
  doc.text(`$${alquiler.expensas.toLocaleString('es-AR')}`, 160, yPos)
  yPos += lineHeight
  
  doc.text('Luz', 25, yPos)
  doc.text(`$${alquiler.luz.toLocaleString('es-AR')}`, 160, yPos)
  yPos += lineHeight
  
  doc.text('Agua', 25, yPos)
  doc.text(`$${alquiler.agua.toLocaleString('es-AR')}`, 160, yPos)
  yPos += lineHeight
  
  doc.text('Otros conceptos', 25, yPos)
  doc.text(`$${alquiler.otros_importes.toLocaleString('es-AR')}`, 160, yPos)
  yPos += lineHeight * 2
  
  // Total
  const total = alquiler.precio + alquiler.expensas + alquiler.luz + alquiler.agua + alquiler.otros_importes
  doc.setFillColor(41, 128, 185)
  doc.rect(20, yPos - 5, 170, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL A PAGAR: $${total.toLocaleString('es-AR')}`, 105, yPos + 3, { align: 'center' })
  
  // Vencimiento
  doc.setTextColor(44, 62, 80)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Fecha de vencimiento: ${fechaVencimiento}`, 20, yPos + 25)
  
  // Pie de página
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Liquidación generada el ${fechaEmision}`, 20, 280)
  doc.text('Sistema de Gestión de Alquileres', 105, 280, { align: 'center' })
  
  return doc
}

// Función para descargar PDF individual
export const descargarLiquidacionPDF = (alquiler, inquilino, propiedad, mesLiquidacion, año) => {
  const doc = generarLiquidacionPDF(alquiler, inquilino, propiedad, mesLiquidacion, año)
  const filename = `liquidacion_${inquilino.apellido}_${mesLiquidacion}_${año}.pdf`
  doc.save(filename)
}

// Función para generar liquidaciones masivas
export const generarLiquidacionesMasivas = async (alquileres, mesLiquidacion, año) => {
  const liquidaciones = []
  
  for (const alquiler of alquileres) {
    try {
      const doc = generarLiquidacionPDF(
        alquiler,
        alquiler.inquilinos,
        alquiler.propiedades,
        mesLiquidacion,
        año
      )
      
      liquidaciones.push({
        inquilino: `${alquiler.inquilinos.nombre} ${alquiler.inquilinos.apellido}`,
        propiedad: alquiler.propiedades.direccion,
        doc: doc,
        filename: `liquidacion_${alquiler.inquilinos.apellido}_${mesLiquidacion}_${año}.pdf`
      })
    } catch (error) {
      console.error(`Error generando liquidación para ${alquiler.inquilinos.nombre}:`, error)
    }
  }
  
  return liquidaciones
}

// Función para obtener alquileres que vencen el 10 del mes
export const obtenerAlquileresVencimientoMensual = (alquileres, mes, año) => {
  const fechaVencimiento = new Date(año, mes - 1, 10)
  const fechaActual = new Date()
  
  return alquileres.filter(alquiler => {
    if (!alquiler.activo || new Date(alquiler.fecha_finalizacion) < fechaActual) {
      return false
    }
    
    const inicioContrato = new Date(alquiler.inicio_contrato)
    const finContrato = new Date(alquiler.fecha_finalizacion)
    
    return inicioContrato <= fechaVencimiento && finContrato >= fechaVencimiento
  })
} 