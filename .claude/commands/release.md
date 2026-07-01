# Skill: Release — Control de versiones y despliegue a producción

> **Cómo instalar como comando de Claude Code:**
> Copiar este fichero a `.claude/commands/release.md` en el proyecto que quieras desplegar.
> Luego invócalo con `/release` en cualquier conversación con Claude Code en ese proyecto.
>
> También puedes instalarlo globalmente en `~/.claude/commands/release.md`.

---

Tu misión es gestionar el proceso completo de release: calcular la nueva versión, actualizar los ficheros, hacer commit/push, crear el tag, desplegar a Firebase Hosting y verificar que la versión está activa en producción.

Sigue los pasos **en orden**. El único punto de pausa obligatoria es al final del PASO 2, antes de modificar nada.

---

## PASO 1 — Obtener versión de producción y versión local

**1a. Localizar la URL de producción**

Busca en este orden:
1. Constante `ProductionUrl` en `AppVersion.cs`
2. Campo `"site"` en `firebase.json` o `.firebaserc` (formato `"site": "mi-proyecto"` → URL es `https://mi-proyecto.web.app`)
3. Si no encuentras ninguna → pregunta al usuario la URL y guárdala en `AppVersion.cs` como `public const string ProductionUrl = "https://...";`

**1b. Obtener versión en producción**

Haz una petición HTTP GET a `[ProductionUrl]/data/version.json`. Extrae el campo `version`.

Si ese endpoint no existe o devuelve error, intenta obtener la versión de la página HTML principal buscando en el meta o en el HTML renderizado. Si tampoco → anota "versión de producción desconocida" y continúa.

**1c. Leer versión local**

Lee `AppVersion.cs` y extrae la constante `Version`.

**Muestra:**
```
Versión en producción : X.Y.Z
Versión local         : X.Y.Z
```

---

## PASO 2 — Calcular la nueva versión

Lee el componente `AcercaDe.razor` (o el fichero de historial de versiones del proyecto) para encontrar si ya existe una entrada correspondiente al mes actual (busca el nombre del mes en español o inglés, ej. "junio 2026", "June 2026", "jun. 2026").

**Regla de versión (MAJOR.MINOR.PATCH):**
- Si **ya hay una entrada del mes actual** en el historial → incrementa solo el PATCH: `X.Y.Z → X.Y.(Z+1)`
- Si **no hay entrada del mes actual** → incrementa el MINOR y resetea PATCH: `X.Y.Z → X.(Y+1).0`
- MAJOR solo cambia en reescrituras o cambios de stack significativos (no aplica en un release normal)

**Muestra al usuario y espera confirmación:**
```
Versión prod  : X.Y.Z
Nueva versión : X.Y.Z+1
Motivo        : [ya hay release en junio 2026 / primera release de junio 2026]
Rama actual   : [main/master/feature-xxx]

¿Confirmas el release? Responde 'sí' para continuar o 'no' para cancelar.
```

⚠️ **No modifiques ningún fichero hasta recibir confirmación explícita del usuario.**

---

## PASO 3 — Actualizar los ficheros de versión

Una vez confirmado, actualiza estos 4 ficheros con la nueva versión y la fecha de hoy (formato `YYYY-MM-DD`):

**AppVersion.cs**
```csharp
public const string Version = "X.Y.Z";
public const string BuildDate = "YYYY-MM-DD";
```

**\*.csproj** (busca el único .csproj en la raíz del proyecto)
```xml
<Version>X.Y.Z</Version>
<FileVersion>X.Y.Z</FileVersion>
<AssemblyVersion>X.Y.Z</AssemblyVersion>
```

**wwwroot/data/version.json**
```json
{
  "version": "X.Y.Z",
  "buildDate": "YYYY-MM-DD",
  "description": "[descripción breve de los cambios de esta release]"
}
```

**AcercaDe.razor** — actualización del historial:
- Si es **PATCH**: actualiza la entrada existente del mes actual (no crees una nueva)
- Si es **MINOR**: añade una nueva entrada al inicio. Máximo 5 ítems por entrada, máximo 5 entradas totales (elimina la más antigua si hay 5)

Para la descripción en `version.json` y el contenido de `AcercaDe.razor`, usa el `git log` reciente para resumir los cambios significativos de esta sesión.

---

## PASO 4 — Commit y push a la rama principal

Detecta la rama actual con `git branch --show-current` y el nombre de la rama principal (`main` o `master`) con `git remote show origin | grep 'HEAD branch'`.

**Si estás en una rama feature (no es main ni master):**
```bash
git fetch origin
git checkout <rama-principal>
git pull origin <rama-principal>
git merge --squash <rama-feature>
git commit -m "Release vX.Y.Z: [descripción breve]"
git push origin <rama-principal>
```

**Si ya estás en main o master:**
```bash
git add AppVersion.cs
git add $(find . -name "*.csproj" -not -path "*/obj/*")
git add wwwroot/data/version.json
git add $(find . -name "AcercaDe.razor" -not -path "*/obj/*")
git commit -m "Release vX.Y.Z: [descripción breve]"
git push origin <rama-principal>
```

El mensaje de commit debe ser informativo: resume en una frase qué cambia en esta versión.

---

## PASO 5 — Crear y publicar el tag de versión

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

Verifica que el tag se ha creado con `git tag -l "vX.Y.Z"`.

---

## PASO 6 — Publicar y desplegar a Firebase Hosting

```bash
dotnet publish -c Release -o publish_output
firebase deploy --only hosting
```

Muestra la salida completa del deploy. Si el comando falla:
- ❌ Reporta el error exacto
- Detén aquí. No intentes verificar la versión en producción.

---

## PASO 7 — Verificar versión en producción

Espera unos segundos tras el deploy y haz HTTP GET a `[ProductionUrl]/data/version.json`.

- ✅ Si `version` coincide con la nueva versión → "Deploy confirmado: vX.Y.Z activa en producción"
- ⚠️ Si la versión sigue siendo la antigua → puede ser caché de Firebase CDN; espera 30 segundos e inténtalo de nuevo. Si persiste, informa al usuario.
- ❌ Si el endpoint devuelve error HTTP → reporta el código de estado

---

## Informe final

Al terminar, genera esta tabla resumen:

| # | Paso | Resultado |
|---|------|-----------|
| 1 | Versión producción obtenida | ✅ vX.Y.Z / ⚠️ desconocida |
| 2 | Nueva versión calculada | vX.Y.Z (PATCH/MINOR) |
| 3 | Ficheros de versión actualizados | ✅ / ❌ |
| 4 | Commit & push `<rama>` | ✅ / ❌ |
| 5 | Tag vX.Y.Z pusheado | ✅ / ❌ |
| 6 | Deploy Firebase Hosting | ✅ / ❌ |
| 7 | Verificación en producción | ✅ vX.Y.Z / ⚠️ pendiente / ❌ error |
