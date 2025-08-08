# Sistema de Tooltips Global - ThinkTimer

## 🎯 Características Principales

### ✅ **Sistema Completamente Global**
- **No requiere modificaciones en componentes**: Simplemente agrega `data-tooltip` a cualquier elemento
- **Event delegation**: Usa un solo listener global que detecta automáticamente todos los tooltips
- **Contenedor global**: Los tooltips se renderizan en un contenedor fijo fuera del DOM normal

### ✅ **Z-index Superior**
- **z-index: 100000**: Garantiza que aparezcan por encima de todo
- **Contenedor global fijo**: Evita problemas de scroll y overflow en navbar
- **Posicionamiento absoluto**: Calculado globalmente respecto al viewport

### ✅ **Auto-detección**
- **Automático**: Cualquier elemento con `data-tooltip` tendrá tooltip automáticamente
- **Sin inicialización manual**: No necesitas llamar funciones para cada elemento
- **Dinámico**: Funciona con elementos agregados dinámicamente

## 🚀 Uso Básico

### HTML Simple
```html
<!-- Tooltip básico -->
<button data-tooltip="Mi tooltip">Hover me</button>

<!-- Con posición -->
<button data-tooltip="Tooltip a la derecha" data-tooltip-position="right">Button</button>

<!-- Con tema -->
<button data-tooltip="¡Éxito!" data-tooltip-theme="success">Success</button>
```

### Atributos Disponibles

| Atributo | Descripción | Valores | Default |
|----------|-------------|---------|---------|
| `data-tooltip` | Texto del tooltip | Cualquier string | - |
| `data-tooltip-position` | Posición del tooltip | `top`, `bottom`, `left`, `right` | `top` |
| `data-tooltip-theme` | Tema visual | `default`, `dark`, `success`, `error` | `default` |

## 🎨 Temas Disponibles

### Default
```html
<button data-tooltip="Tooltip estándar">Default</button>
```

### Dark
```html
<button data-tooltip="Texto claro sobre fondo oscuro" data-tooltip-theme="dark">Dark</button>
```

### Success
```html
<button data-tooltip="¡Operación exitosa!" data-tooltip-theme="success">Success</button>
```

### Error
```html
<button data-tooltip="Error: Algo salió mal" data-tooltip-theme="error">Error</button>
```

## 📍 Posicionamiento Inteligente

El sistema automáticamente:
- **Detecta bordes del viewport** y cambia la posición si es necesario
- **Centra tooltips** respecto al elemento
- **Mantiene distancias** apropiadas del elemento
- **Respeta scroll** y se oculta automáticamente

### Ejemplos de Auto-posicionamiento
```html
<!-- Se mostrará arriba, pero si no hay espacio, cambiará a abajo -->
<button data-tooltip="Auto-posicionado" data-tooltip-position="top">Smart</button>

<!-- Perfecto para navbar: siempre hacia la derecha -->
<button data-tooltip="Fuera del navbar" data-tooltip-position="right">Navbar Item</button>
```

## 🔧 API Programática

### Agregar Tooltip Dinámicamente
```javascript
// Agregar tooltip simple
tooltipManager.addTooltip(element, "Mi tooltip dinámico");

// Con opciones
tooltipManager.addTooltip(element, "Tooltip avanzado", {
    position: "right",
    theme: "success"
});
```

### Actualizar Tooltip
```javascript
tooltipManager.updateTooltip(element, "Nuevo texto");
```

### Remover Tooltip
```javascript
tooltipManager.removeTooltip(element);
```

### Mostrar/Ocultar Manualmente
```javascript
// Mostrar inmediatamente
tooltipManager.show(element);

// Ocultar inmediatamente
tooltipManager.hide();
```

### Configurar Delays
```javascript
// Cambiar delays globalmente
tooltipManager.setDelays(300, 50); // showDelay, hideDelay en ms
```

## 🔄 Comportamiento Automático

### Eventos que Muestran Tooltips
- `mouseenter` - Al pasar el mouse
- `focus` - Al enfocar con teclado

### Eventos que Ocultan Tooltips
- `mouseleave` - Al salir del elemento
- `blur` - Al perder foco
- `scroll` - Al hacer scroll (en cualquier elemento)
- `resize` - Al cambiar tamaño de ventana
- `Escape` - Al presionar tecla Escape
- `window blur` - Al cambiar de ventana

## 🎯 Ejemplos Reales en ThinkTimer

### Navbar (Solucionado)
```html
<button class="nav-item" data-tooltip="Home" data-tooltip-position="right">
    <i class="fas fa-home"></i>
    <span>Home</span>
</button>
```

### Timer Controls
```html
<button data-tooltip="Iniciar cronómetro" data-tooltip-position="top">Start</button>
<button data-tooltip="Pausar cronómetro" data-tooltip-position="top">Pause</button>
```

### Action Buttons
```html
<button data-tooltip="Crear nuevo proyecto" data-tooltip-position="bottom">Add Project</button>
<button data-tooltip="Eliminar permanentemente" data-tooltip-theme="error">Delete</button>
```

## 🔧 Integración Técnica

### 1. Sistema Global Automático
- Se inicializa automáticamente al cargar la página
- Usa **event delegation** en `document` para detectar todos los tooltips
- **No requiere llamadas manuales** para elementos existentes

### 2. Contenedor Global
- Crea `#global-tooltip-container` en `body`
- **Position fixed** con **z-index: 99999**
- **Pointer-events: none** para no interferir con UI

### 3. Posicionamiento Absoluto
- Calcula posición respecto al **viewport completo**
- Considera **scroll offset** automáticamente
- **Ajusta posición** si sale de pantalla

## ✅ Problemas Solucionados

### ❌ Antes:
- Tooltips aparecían dentro de navbar
- Creaba scroll horizontal en navbar
- Z-index bajo, se ocultaban detrás de elementos
- Necesitaba inicialización manual en cada componente

### ✅ Ahora:
- **Tooltips completamente globales** con z-index supremo
- **Auto-detección** de cualquier elemento con `data-tooltip`
- **Posicionamiento inteligente** que evita overflow
- **Cero configuración** - funciona automáticamente

## 🚀 Conclusión

El nuevo sistema es **completamente plug-and-play**:

1. **Agrega `data-tooltip`** a cualquier elemento
2. **Opcionalmente** especifica posición y tema
3. **¡Listo!** - El tooltip funciona automáticamente

No más inicializaciones manuales, no más problemas de z-index, no más overflow en navbar. El sistema es completamente global y automático.
