Perfecto. Acá va el prompt completo para Figma:

CONTEXTO DEL PRODUCTO

openFactory es una plataforma de especificación de trabajo para agentes de IA. No es un chat, no es un generador de prompts, no es un workflow engine. Es la capa de diseño que transforma intención vaga en trabajo ejecutable.

El flujo central tiene 3 etapas visibles para el usuario:

Raw / Define → Shape → Box

FLUJO COMPLETO A DISEÑAR

1. Landing Página de entrada del producto. Debe comunicar en 5 segundos qué es openFactory y por qué importa.

Mensaje central: "Turn vague ideas into execution-ready work packages for AI systems"

Secciones sugeridas:

    Hero con CTA "Start a workspace"
    Las 3 etapas explicadas visualmente (Raw/Define → Shape → Box)
    Casos de uso: software, marketing, arquitectura, investigación
    Social proof o early access CTA
    Footer

2. Login con Google Pantalla simple. Solo Google OAuth. No formularios de registro.

3. Dashboard / Home del usuario Vista post-login. Muestra workspaces activos del usuario y compartidos con él.

Elementos:

    Lista de workspaces con nombre, etapa actual, última actividad
    Botón "New workspace"
    Sección "Shared with me" — workspaces donde otros lo invitaron
    Avatar y datos del usuario (nombre, email, plan)
    Navegación lateral simple

4. Perfil de usuario Datos personales: nombre, email, avatar, plan actual. Preferencias: idioma de output, modo por defecto (auto/interactive).

5. Workspace — Etapa 1: Raw / Define (COLABORATIVA)

Esta es la etapa más importante de diseñar.

Layout: dos columnas.

Columna izquierda — el board:

    Área de pins estilo post-it (como en el prototipo actual)
    Cada pin tiene: texto, color por tipo (#01, #02...), botón de eliminar
    Input para agregar nuevo pin
    Barra inferior: + Note / + File / + Link / + Audio / + Image
    Indicador de colaboradores activos en tiempo real (avatares)
    Cada pin puede tener avatar del colaborador que lo agregó

Columna derecha — Live Brief (panel reactivo):

    Título: "LIVE BRIEF · updating"
    "WE THINK THIS IS THE WORK" → síntesis del objetivo en tiempo real
    "WHAT WE PICKED UP" → lista de elementos detectados
    "STILL UNCLEAR" → señales pendientes con íconos de advertencia
    Readiness signals: 5 indicadores (Intent / Actor / Scope / Constraints / Success criteria) con estados ✅ / ⚠️
    CTA principal: "Define this work →" (se activa cuando hay suficiente material)
    Texto secundario: "You can keep adding ideas after"

Estados de la pantalla:

    Estado vacío: board en blanco, panel derecho con instrucciones
    Estado con pins: panel derecho se actualiza
    Estado listo: CTA se activa, readiness signals en verde

Colaboración en Raw/Define:

    Múltiples usuarios pueden agregar pins simultáneamente
    Cada pin muestra el avatar del autor
    Indicador de quién está activo ahora (avatares en header)
    Opción "Share this workspace" — enviar link de invitación

6. Workspace — Etapa 2: Shape (COLABORATIVA)

Layout: tres zonas.

Zona izquierda — Work Map:

    Árbol de boxes en forma de lista vertical
    Cada box tiene: número (B01, B02...), título, estado (Ready / Draft / Too broad / Needs review)
    Box seleccionado se resalta
    Botones: "+ New box" / "Reshape"
    Work sequence en la parte inferior — orden de ejecución horizontal (B01 → B02 → B03 ∥ B04)

Zona central — detalle del box seleccionado:

    Título del box
    Purpose
    Input context
    Expected output
    Acceptance criteria
    Depends on (otros boxes)
    Hands off to (siguiente box)
    Estado del box

Zona derecha — Readiness signals:

    4 indicadores: Core boxes created / Dependencies mapped / Run order coherent / Validation step present
    Contador: "X of Y signals clear"
    CTA: "Package →"

Colaboración en Shape:

    Opción "Send Shape to..." — compartir el work tree con alguien para revisión
    Un colaborador puede marcar boxes como "Approved" o agregar comentarios
    Indicador de qué boxes fueron revisados por quién

7. Workspace — Etapa 3: Box (HANDOFF)

Layout: panel central con panel derecho de readiness.

Panel central — Package:

    Nombre del proyecto
    Estado: "Assembling" → "Ready"
    Contador: "X boxes · Y of Z signals clear"
    Handoff Summary:
        Project name
        Main idea
        Boxes count
        Run order (Sequential + N parallel stages)
        Handoff notes (campo editable)

Panel derecho — Readiness checklist:

    Brief included ✅
    Boxes packaged ✅
    Work sequence attached ✅
    Package is portable ✅
    Handoff notes present ✅ / ⚠️

Botones:

    "Export package →" (descarga el BoxPackage)
    "Back to Shape"

Colaboración en Box:

    "Approve package" — otro usuario puede aprobar el package antes de exportar
    Estado: "Pending approval from [nombre]"
    Una vez aprobado: "Approved by [nombre] · [fecha]"

8. Flujo de colaboración — Share & Review

Tres acciones de colaboración a diseñar:

A. Compartir workspace completo

    Modal: "Invite collaborator" con email input
    Rol: Editor / Reviewer
    Link copiable

B. Enviar Shape para revisión

    Modal: "Send Shape to..." con selector de usuario
    El receptor ve el work tree en modo review
    Puede aprobar boxes individualmente o dejar comentarios

C. Aprobar Box package

    Notificación al aprobador
    Vista de review del package completo
    Botones: "Approve" / "Request changes"

SISTEMA DE DISEÑO

Tipografía: sans-serif moderna, legible en densidad alta.

Colores por estado de box:

    Ready: verde
    Draft: gris/neutro
    Too broad: naranja/amarillo
    Needs review: azul/info
    Approved: verde oscuro

Colores por etapa:

    Raw/Define: tono cálido (amarillo/crema)
    Shape: tono neutro (gris/blanco)
    Box: tono de cierre (azul/índigo)

Componentes clave a definir:

    Pin card (Raw)
    Box card (Shape)
    Readiness signal indicator
    Live Brief panel
    Work sequence bar
    Collaboration avatar stack
    Package summary card

ESTADOS A PROTOTIPAR POR ETAPA

Etapa 1 — Raw/Define:

    Empty state
    Con pins, brief actualizándose
    Brief completo, CTA activo
    Colaboración activa (múltiples avatares)

Etapa 2 — Shape:

    Árbol inicial generado
    Box seleccionado con detalle
    Box "Too broad" con acción sugerida
    Work sequence visible
    Shape enviado para revisión

Etapa 3 — Box:

    Assembling (en proceso)
    Ready para export
    Pending approval
    Approved y exportado

PRINCIPIOS DE UX

    El sistema nunca bloquea — siempre podés avanzar
    Los readiness signals informan sin bloquear
    La colaboración es asíncrona — no requiere que todos estén online al mismo tiempo
    El output (BoxPackage) debe poder compartirse sin necesidad de que el receptor tenga cuenta
