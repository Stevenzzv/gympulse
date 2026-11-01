import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/ui'

/*
 * Plantillas de Términos y Privacidad. ANTES DE COBRAR: completa los datos entre [corchetes]
 * y haz que un abogado las revise (en Ecuador aplica la Ley Orgánica de Protección de Datos Personales).
 */
const COMPANY = {
  name: '[Nombre o razón social]',
  id: '[RUC]',
  city: '[Ciudad], Ecuador',
  email: '[correo de contacto]',
  updated: '1 de noviembre de 2026',
}

const DOCS = {
  terms: {
    title: 'Términos y condiciones',
    sections: [
      ['Quiénes somos', `GymPulse es un servicio de software en la nube operado por ${COMPANY.name}, con RUC ${COMPANY.id}, con domicilio en ${COMPANY.city}. Puedes escribirnos a ${COMPANY.email}.`],
      ['El servicio', 'GymPulse permite a gimnasios registrar socios, planes, ventas y ver estadísticas. Lo ofrecemos "tal como está" y trabajamos para que esté disponible de forma continua, pero puede haber interrupciones por mantenimiento o fallas de proveedores.'],
      ['Cuenta', 'Eres responsable de mantener tu contraseña en secreto y de la información que registras. Debes ser mayor de edad y tener autorización para registrar los datos de tus socios.'],
      ['Prueba gratuita y pagos', 'Las cuentas nuevas tienen 7 días de prueba gratuita. Luego, el acceso para registrar información requiere una suscripción pagada (mensual, trimestral o anual) por transferencia, DeUna o PayPal. Los precios están en dólares de EE. UU. e incluyen los impuestos que indique tu factura.'],
      ['Vencimiento', 'Si la suscripción vence, tus datos se conservan y puedes consultarlos, pero no registrar información nueva hasta renovar.'],
      ['Reembolsos', 'Los pagos de periodos ya iniciados no son reembolsables, salvo error de cobro atribuible a nosotros.'],
      ['Cancelación', 'Puedes dejar de usar el servicio cuando quieras. Si quieres que eliminemos tu cuenta y tus datos, escríbenos.'],
      ['Uso aceptable', 'No puedes usar GymPulse para actividades ilegales, para intentar acceder a datos de otros usuarios ni para afectar el funcionamiento del servicio.'],
      ['Responsabilidad', 'En la medida que permita la ley, nuestra responsabilidad total se limita a lo que hayas pagado en los últimos 3 meses.'],
      ['Cambios', 'Podemos actualizar estos términos. Te avisaremos de los cambios importantes con anticipación.'],
      ['Ley aplicable', 'Estos términos se rigen por las leyes de la República del Ecuador.'],
    ],
  },
  privacy: {
    title: 'Política de privacidad',
    sections: [
      ['Responsable', `El responsable del tratamiento de los datos de tu cuenta es ${COMPANY.name} (RUC ${COMPANY.id}), ${COMPANY.city}. Contacto: ${COMPANY.email}.`],
      ['Datos que recogemos', 'De tu cuenta: nombre, email, teléfono (opcional) y contraseña cifrada. De tus pagos: método, monto, número de comprobante y, si lo subes, la imagen del comprobante.'],
      ['Datos de tus socios', 'Los datos de los socios que registras (contacto, planes, observaciones) son tuyos: tú eres el responsable de tratarlos y nosotros solo los almacenamos para prestarte el servicio. Las observaciones pueden incluir datos de salud; regístralos solo con el consentimiento del socio.'],
      ['Para qué los usamos', 'Para darte acceso, procesar tus pagos, enviarte avisos de tu suscripción y darte soporte. No vendemos tus datos ni los de tus socios.'],
      ['Con quién los compartimos', 'Solo con proveedores necesarios para operar: alojamiento del servidor y la base de datos, y PayPal si pagas por ese medio.'],
      ['Seguridad', 'Las conexiones van cifradas (HTTPS), las contraseñas se guardan cifradas y cada gimnasio solo puede ver sus propios datos.'],
      ['Cuánto tiempo', 'Mientras tu cuenta exista. Si pides eliminarla, borramos tus datos salvo los que la ley nos obligue a conservar, como registros de facturación.'],
      ['Tus derechos', 'Puedes pedir acceso, rectificación, eliminación, oposición o portabilidad de tus datos escribiendo a nuestro correo de contacto, conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador.'],
      ['Cambios', 'Publicaremos aquí cualquier cambio a esta política y te avisaremos si es importante.'],
    ],
  },
}

export default function Legal({ doc }) {
  const { title, sections } = DOCS[doc]
  useEffect(() => { document.title = `${title} · GymPulse` }, [title])
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-lg"><Logo /></Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" /> Inicio</Link>
      </div>
      <p className="hud-label mt-14">Última actualización · {COMPANY.updated}</p>
      <h1 className="mt-3 font-display text-4xl font-bold">{title}</h1>
      <div className="card mt-10 divide-y divide-line">
        {sections.map(([h, text], i) => (
          <section key={h} className="grid gap-2 p-6 sm:grid-cols-[3rem_1fr]">
            <span className="num text-sm text-brand-300">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2 className="font-display text-lg font-semibold">{h}</h2>
              <p className="mt-2 leading-7 text-muted">{text}</p>
            </div>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-subtle">
        Ver también: {doc === 'terms'
          ? <Link to="/privacidad" className="text-brand-300 hover:underline">Política de privacidad</Link>
          : <Link to="/terminos" className="text-brand-300 hover:underline">Términos y condiciones</Link>}
      </p>
    </div>
  )
}
