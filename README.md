# GymPulse: software para gimnasios (SaaS)

Los dueños de gimnasios se registran con una prueba gratis y luego pagan la suscripción por
**transferencia o DeUna (Ecuador)** o por **PayPal (internacional)**. Dentro de la app registran
**gimnasios, socios (con plan y observaciones), planes y cada venta**, y ven un **panel de estadísticas**.

| Capa     | Tecnología |
|----------|------------|
| Backend  | Java 21, Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, H2 (desarrollo) / PostgreSQL (producción) |
| Frontend | React 18, Vite, TailwindCSS, React Router, Recharts, Axios |

## Funciones

- **Landing** en español con funciones, los 3 planes (mensual, trimestral, anual), formas de pago y preguntas frecuentes.
- **Registro e ingreso** con JWT y contraseñas cifradas (BCrypt). Al registrarse empieza la prueba gratis (14 días por defecto).
  Se pide el WhatsApp (opcional) para avisar renovaciones.
- **Varias sucursales**: cada dueño ve solo sus gimnasios.
- **Socios**: datos de contacto, cédula, fecha de nacimiento, plan, estado, vencimiento y **observaciones** (lesiones, objetivos…).
- **Planes del gimnasio**: precio y duración en días.
- **Ventas**: vender un plan a un socio (pone el precio y **renueva su membresía**) o cualquier producto o servicio.
  Métodos: efectivo, tarjeta, transferencia, DeUna, PayPal, otro.
- **Panel de estadísticas**: ingresos del mes vs. mes anterior, ventas, ticket promedio, socios con plan vigente,
  inscripciones, socios por vencer, gráficos mensuales (con vista de tabla), lo más vendido, métodos de pago.
- **Suscripción del SaaS**:
  - **Transferencia / DeUna**: el dueño ve tus datos bancarios y tu DeUna, paga, y registra el número de comprobante
    (y opcionalmente una foto o PDF). El pago queda **en revisión** hasta que tú lo apruebes.
  - **PayPal**: botón con el enlace de pago de cada plan; el webhook de PayPal activa el plan automáticamente.
  - Al vencer, los datos quedan en **solo lectura** (las escrituras responden 402) hasta renovar.
- **Panel de administración** (`/app/admin`, solo rol ADMIN):
  - Pagos por revisar: ver comprobante, ajustar meses, **aprobar** o **rechazar** (con motivo que ve el cliente).
  - Clientes: estado, vencimiento, filtros (pagando, en prueba, vencen pronto, vencidos) y botón de **WhatsApp**
    con un mensaje de recordatorio ya escrito.
  - Registrar pagos recibidos fuera de la app (efectivo, etc.) y activar meses.
  - Historial de todos los pagos.

## Ejecutar en tu computadora

Requisitos: JDK 21+, Maven 3.9+, Node 20+.

```bash
cd backend
mvn spring-boot:run
```

La API corre en http://localhost:8080 con una base H2 en archivo (`backend/data/`). Se crean cuentas de prueba:

| Cuenta | Email | Contraseña |
|---|---|---|
| Dueño con un año de datos | demo@gymsaas.app | demo1234 |
| Administrador | admin@gymsaas.app | admin1234 |

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173. Vite redirige `/api` al backend.

Pruebas del backend:

```bash
cd backend && mvn test
```

## Configuración (variables de entorno)

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `JWT_SECRET` | valor de desarrollo | **Obligatorio en producción**, mínimo 32 caracteres |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | H2 en archivo | ej. `jdbc:postgresql://host:5432/gympulse` |
| `CORS_ORIGINS` | `http://localhost:5173` | Dominio(s) del frontend, separados por coma |
| `ADMIN_EMAILS` | `admin@gymsaas.app` (vacío en prod) | Emails con rol ADMIN, separados por coma. Regístrate con ese email y al reiniciar quedas como admin |
| `TRIAL_DAYS` | `14` | Días de prueba gratis |
| `PLAN_MONTHLY_PRICE` / `PLAN_QUARTERLY_PRICE` / `PLAN_YEARLY_PRICE` | `29.00` / `79.00` / `290.00` | Precios en USD |
| `BANK_NAME`, `BANK_ACCOUNT_TYPE`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER`, `BANK_HOLDER_ID` | datos de ejemplo | Tu cuenta para transferencias (`BANK_HOLDER_ID` = cédula o RUC) |
| `DEUNA_PHONE` | vacío | Tu número de DeUna |
| `DEUNA_QR_URL` | vacío | URL de la imagen de tu QR de DeUna (puedes ponerla en `frontend/public/deuna-qr.png` y usar `/deuna-qr.png`) |
| `SUPPORT_WHATSAPP`, `SUPPORT_EMAIL` | vacío | Contacto de soporte que ven los clientes |
| `PAYPAL_LINK_MONTHLY` / `PAYPAL_LINK_QUARTERLY` / `PAYPAL_LINK_YEARLY` | vacío | Enlace de pago de PayPal por plan. Si está vacío, ese plan no muestra PayPal |
| `PAYPAL_MODE` | `sandbox` (`live` en prod) | API de PayPal a usar |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` | vacío | Para **verificar** los webhooks de PayPal |
| `PAYPAL_SIMULATION_ENABLED` | `true` (siempre `false` en prod) | Muestra "Simular pago" para pruebas |
| `SEED_DEMO` | `true` (siempre `false` en prod) | Crea las cuentas y datos de prueba |

Los campos bancarios vacíos no se muestran al cliente.

**Producción:** ejecuta con `SPRING_PROFILES_ACTIVE=prod` (apaga la consola H2, los datos demo y la simulación de pagos)
y compila el frontend con `VITE_API_URL=https://api.tudominio.com npm run build`.

## Publicar en internet

El `Dockerfile` de la raíz arma **una sola imagen** con la web (React) y la API (Spring Boot): la misma dirección
sirve todo, así que no hace falta configurar `VITE_API_URL` ni CORS aparte.

1. **Sube el proyecto a GitHub** (repositorio privado).
2. **Base de datos**: crea un PostgreSQL gratuito en [Neon](https://neon.tech) (o Supabase). De la cadena de conexión
   saca host, base, usuario y contraseña. `DB_URL` queda así: `jdbc:postgresql://HOST/BASE?sslmode=require`.
3. **Servidor**: en [Render](https://render.com) → *New* → *Blueprint* → elige tu repositorio. Render lee
   `render.yaml` y te pide las variables (`DB_URL`, `DB_USER`, `DB_PASSWORD`, `ADMIN_EMAILS`, datos bancarios…).
   `JWT_SECRET` se genera solo. `render.yaml` usa el plan **gratis** para probar: se "duerme" tras 15 minutos sin uso
   y tarda ~1 minuto en despertar. Para clientes reales cambia `plan: free` por `plan: starter`.
4. Abre la URL que te da Render (`https://gympulse-xxxx.onrender.com`), **regístrate con el email de `ADMIN_EMAILS`**
   y ya tienes el panel de administración.
5. **Dominio propio** (opcional): en Render → *Settings* → *Custom Domains*, agrega `tudominio.com` y crea en tu
   proveedor de dominio el registro DNS que te indique. El HTTPS es automático. Luego pon `CORS_ORIGINS=https://tudominio.com`.

Cada `git push` a la rama principal vuelve a desplegar. Las tablas se crean solas al arrancar.

## Cómo cobrar

### Transferencia y DeUna (Ecuador)
1. Configura `BANK_*`, `DEUNA_PHONE` y/o `DEUNA_QR_URL`, y `SUPPORT_WHATSAPP`.
2. Configura `ADMIN_EMAILS` con tu email, regístrate en la app con ese email y reinicia el backend.
3. Cuando un cliente registre un pago, aparece en **Pagos y clientes → Por revisar** (con un contador en el menú).
4. **Confirma en tu banco o en DeUna que el dinero llegó** y que la referencia coincide; luego **Aprobar**.
   Los meses se suman a lo que le quede (incluida la prueba). Si no aparece, **Rechazar** con el motivo.
5. Emite la factura electrónica del SRI por cada pago aprobado (fuera de la app, con tu sistema de facturación).

Los comprobantes se guardan en la base de datos (máx. 5 MB, JPG/PNG/WEBP/HEIC/PDF), así no se pierden al redesplegar.

### PayPal (internacional)
1. En tu cuenta PayPal Business crea un **enlace de pago** por cada plan que quieras ofrecer, por el precio exacto,
   y ponlos en `PAYPAL_LINK_*`.
2. En el PayPal Developer Dashboard crea una app REST y configura `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.
3. Agrega un webhook a `https://api.tudominio.com/api/paypal/webhook` con el evento `PAYMENT.CAPTURE.COMPLETED`
   (y `PAYMENT.SALE.COMPLETED` si usas suscripciones o botones antiguos). Pon su id en `PAYPAL_WEBHOOK_ID`.

El pago se asocia a la cuenta por `custom_id` (id del usuario) si tu botón lo envía, o por **el email de PayPal =
email de la cuenta**. Si el monto coincide con el precio de un plan, se activa automáticamente; si no coincide,
queda **en revisión** en el panel de admin. Los webhooks repetidos se ignoran. Los pagos que no se pueden asociar a
ninguna cuenta quedan en el log; regístralos a mano desde **Clientes → Registrar pago**.

> Sin client id, secret y webhook id el webhook **no se puede verificar** y se rechaza (salvo en modo simulación, solo desarrollo).

## API

Todo requiere `Authorization: Bearer <token>` excepto auth, precios públicos y el webhook de PayPal.

```
POST /api/auth/register            POST /api/auth/login            GET /api/auth/me
GET  /api/public/pricing
GET|POST /api/gyms                 PUT|DELETE /api/gyms/{gymId}
GET|POST /api/gyms/{gymId}/plans   PUT|DELETE /api/gyms/{gymId}/plans/{id}
GET|POST /api/gyms/{gymId}/members?q=&status=&page=&size=
GET|PUT|DELETE /api/gyms/{gymId}/members/{id}
GET|POST /api/gyms/{gymId}/sales?from=&to=&page=&size=     DELETE /api/gyms/{gymId}/sales/{id}
GET  /api/gyms/{gymId}/stats?months=12

GET  /api/billing                               POST /api/billing/manual-payments (multipart)
GET  /api/billing/payments/{id}/receipt         POST /api/billing/simulate
POST /api/paypal/webhook

GET  /api/admin/summary                         GET  /api/admin/payments?status=PENDING
POST /api/admin/payments/{id}/approve           POST /api/admin/payments/{id}/reject
GET  /api/admin/payments/{id}/receipt
GET  /api/admin/users                           POST /api/admin/users/{id}/activate
```

## Estructura

```
backend/src/main/java/com/gymsaas
  config/       seguridad, configuración, admins, datos demo
  domain/       entidades JPA (User, Gym, Member, MembershipPlan, Sale, SubscriptionPayment, PaymentReceipt)
  repository/   repositorios y consultas de estadísticas
  security/     JWT, filtros, bloqueo de escritura al vencer (402)
  service/      lógica (socios, ventas, estadísticas, cobros, administración)
  web/          controladores REST, DTOs, manejo de errores
frontend/src
  pages/        Landing, Login, Register, app/ (Panel, Socios, Ventas, Planes, Gimnasios, Suscripción, Admin)
  components/   layout, componentes de UI, formulario de venta, historial de pagos
  context/      sesión y gimnasio seleccionado
  lib/          cliente de la API y formatos (es-EC, USD)
```
