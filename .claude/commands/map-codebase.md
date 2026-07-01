# Skill: Mapa de código (codebase map)

> **Cómo instalar como comando de Claude Code:**
> Copiar este fichero a `.claude/commands/map-codebase.md` en el proyecto que quieras mapear.
> Invócalo con `/map-codebase` en cualquier conversación con Claude Code en ese proyecto.
>
> También puedes instalarlo globalmente en `~/.claude/commands/map-codebase.md`.

---

Tu misión es generar un fichero `codebase-map.md` compacto en la raíz del proyecto y asegurarte de que `CLAUDE.md` lo referencia para que se cargue automáticamente en futuras sesiones.

El objetivo es que cualquier conversación futura pueda leer este único fichero en lugar de explorar decenas de archivos. Prioriza la densidad de información: cada línea debe aportar algo que no sea obvio desde el nombre del fichero.

---

## PASO 1 — Recopilar información del proyecto

Ejecuta estas exploraciones en paralelo:

**1a. Estructura de carpetas relevante**
Lista los ficheros bajo `Pages/`, `Services/`, `Models/`, `Shared/`, `Components/` y la raíz del proyecto (`.razor`, `.cs`, `.json`, `.rules`). Excluye `bin/`, `obj/`, `publish/`, `.git/`, `node_modules/`.

**1b. Servicios**
Para cada fichero en `Services/`:
- Nombre de la clase
- Métodos públicos (solo nombre y parámetros, sin cuerpo)
- Si hereda de `FirebaseServiceBase` o similar, anótalo

**1c. Modelos y colecciones Firebase**
Para cada fichero en `Models/`:
- Nombre de la clase
- Propiedad con `[JsonPropertyName("...")]` que indica el nombre en Firestore
- Si tiene un campo que actúa como colección-raíz (busca constantes tipo `CollectionName`, `Collection`, o strings literales en el servicio correspondiente)

**1d. Páginas y componentes**
Para cada `.razor` en `Pages/` y `Shared/`:
- Nombre del fichero
- `@page` route si existe
- Si tiene `[Authorize]` o comprobación de `IsAdmin`
- Una frase de 5 palabras sobre qué hace (infiere del nombre y contenido)

**1e. Registro en DI (`Program.cs`)**
Busca todas las líneas `builder.Services.Add*` y extrae: tipo de servicio, lifetime (scoped/singleton/transient).

**1f. Firebase**
Lee `firebase.json` y `.firebaserc` (o `firebase.json` en raíz):
- Project ID
- Servicios activos (Hosting, Firestore, Storage, Functions, Auth)
- Si hay `hosting.rewrites` con SPA fallback

Lee `firestore.rules` y `storage.rules` si existen:
- Solo indica si las reglas son ✅ restrictivas, ⚠️ parciales, o ❌ abiertas (basándote en si usan `request.auth`)

---

## PASO 2 — Generar `codebase-map.md`

Crea el fichero en la raíz del proyecto con esta estructura exacta. Adapta las secciones al proyecto real: si no hay Storage, omite esa fila; si hay módulos especiales, añade una sección extra al final.

```markdown
# Codebase Map — [NombreProyecto]
_Generado: [fecha] · Actualizar: `/map-codebase`_

## Estructura
[árbol de carpetas principal, máx. 20 líneas, con recuento entre paréntesis]

## Servicios
| Servicio | Hereda de | Métodos clave |
|----------|-----------|---------------|
| XxxService | FirebaseServiceBase | GetAll(), Add(model), Delete(id) |

## Modelos → Firestore
| Clase | Colección | Campos clave |
|-------|-----------|--------------|
| Plant | `plantas` | Id, Nombre, FechaAlta |

## Páginas
| Fichero | Ruta | Auth | Qué hace |
|---------|------|------|----------|
| Inicio.razor | `/` | — | Landing pública |
| MisElementos.razor | `/mis-elementos` | ✅ | Lista personal del usuario |
| Admin/Panel.razor | `/admin` | 👑 admin | Panel de administración |

## Componentes compartidos
[lista breve: nombre → propósito en una frase]

## DI (Program.cs)
| Servicio | Lifetime |
|----------|----------|
| AuthService | Scoped |
| HttpClient | Singleton |

## Firebase
- **Project**: [project-id]
- **Servicios**: Auth · Firestore · Storage · Functions (los que apliquen)
- **firestore.rules**: ✅/⚠️/❌
- **storage.rules**: ✅/⚠️/❌ (o "no existe")
- **SPA rewrite**: sí/no

## Notas del proyecto
[Solo si hay algo no obvio: una dependencia especial, un patrón inusual, un workaround importante.
Si no hay nada, omite esta sección.]
```

Normas de escritura del mapa:
- Máximo 80 líneas en total. Si el proyecto es grande, resume en lugar de listar todo.
- No copies código. No copies docstrings. Solo nombres, rutas y datos estructurales.
- En "Métodos clave" incluye solo los 3-5 más importantes de cada servicio.
- En "Campos clave" incluye solo los campos de negocio relevantes, no `CreatedAt`, `UpdatedAt` genéricos.

---

## PASO 3 — Actualizar `CLAUDE.md`

Lee el `CLAUDE.md` del proyecto. Busca si ya existe una referencia a `codebase-map.md`.

**Si NO existe**, añade este bloque justo después de la primera sección (o al inicio si el fichero está vacío):

```markdown
## Mapa del código
Lee [`codebase-map.md`](codebase-map.md) al inicio de cada sesión para entender la estructura del proyecto sin explorar ficheros. Actualizar con `/map-codebase`.

```

**Si ya existe**, actualiza solo la fecha en `codebase-map.md`, no toques `CLAUDE.md`.

---

## PASO 4 — Confirmar al usuario

Muestra un resumen de lo generado:

```
✅ codebase-map.md generado ([N] líneas)
✅ CLAUDE.md actualizado para cargar el mapa automáticamente

Próximas sesiones: Claude leerá el mapa al inicio (~[N] tokens)
en lugar de explorar el proyecto (~[estimación] tokens exploración).
Ahorro estimado: ~XX% de tokens en contexto inicial.
```

Estima el ahorro comparando el tamaño del mapa con el número de ficheros que normalmente habría que leer para obtener la misma información (asume ~200 tokens por fichero explorado).
