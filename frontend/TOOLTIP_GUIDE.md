# Sistema de Tooltips Personalizado

Este sistema proporciona tooltips personalizados que se integran perfectamente con el diseño de la aplicación ThinkTimer.

## Características

- **Diseño consistente**: Utiliza las mismas variables CSS de la aplicación
- **Posicionamiento inteligente**: Auto-ajusta la posición si no hay espacio
- **Múltiples temas**: Soporta diferentes variaciones de color
- **Animaciones suaves**: Transiciones de entrada y salida
- **Accesible**: Funciona con teclado y mouse
- **Responsive**: Se adapta a pantallas pequeñas

## Uso Básico

### HTML

Para agregar un tooltip a cualquier elemento, simplemente agrega los atributos `data-tooltip`:

```html
<!-- Tooltip básico -->
<button data-tooltip="Este es un tooltip básico">Hover me</button>

<!-- Tooltip con posición específica -->
<button data-tooltip="Tooltip a la derecha" data-tooltip-position="right">Right tooltip</button>

<!-- Tooltip con tema personalizado -->
<button data-tooltip="Tooltip de éxito" data-tooltip-theme="success">Success tooltip</button>
```

### Atributos Disponibles

- `data-tooltip`: El texto a mostrar en el tooltip (requerido)
- `data-tooltip-position`: Posición del tooltip (`top`, `bottom`, `left`, `right`) - por defecto: `top`
- `data-tooltip-theme`: Tema del tooltip (`default`, `dark`, `success`, `error`) - por defecto: `default`

## Posiciones Disponibles

- `top`: Aparece arriba del elemento
- `bottom`: Aparece debajo del elemento  
- `left`: Aparece a la izquierda del elemento
- `right`: Aparece a la derecha del elemento

El sistema automáticamente cambiará la posición si no hay suficiente espacio en el viewport.

## Temas Disponibles

### Default
Usa el tema estándar de la aplicación con fondo claro y borde.

### Dark
Texto claro sobre fondo oscuro.

### Success
Fondo verde para mensajes de éxito.

### Error
Fondo rojo para mensajes de error.

## API Programática

### Métodos Disponibles

```javascript
// Agregar tooltip programáticamente
tooltipManager.addTooltip(element, 'Texto del tooltip', {
    position: 'top',
    theme: 'default'
});

// Remover tooltip
tooltipManager.removeTooltip(element);

// Actualizar texto del tooltip
tooltipManager.updateTooltip(element, 'Nuevo texto');

// Mostrar tooltip inmediatamente
tooltipManager.show(element);

// Ocultar tooltip inmediatamente
tooltipManager.hide(element);

// Refrescar todos los tooltips (útil después de cambios en el DOM)
tooltipManager.refresh();

// Configurar delays globales
tooltipManager.setDelays(500, 100); // showDelay, hideDelay en ms
```

### Eventos

El sistema maneja automáticamente los siguientes eventos:

- `mouseenter/mouseleave`: Para mostrar/ocultar con mouse
- `focus/blur`: Para mostrar/ocultar con teclado
- `scroll`: Oculta tooltips al hacer scroll
- `blur` (window): Oculta tooltips cuando la ventana pierde foco
- `keydown` (Escape): Oculta tooltip activo

## Ejemplos de Uso

### Botones de Acción
```html
<button data-tooltip="Guardar cambios" data-tooltip-position="top">
    <i class="fas fa-save"></i> Save
</button>
```

### Iconos Informativos
```html
<i class="fas fa-info-circle" 
   data-tooltip="Esta función requiere permisos de administrador" 
   data-tooltip-position="right"
   data-tooltip-theme="dark"></i>
```

### Navegación Colapsada
```html
<button data-tooltip="Dashboard" data-tooltip-position="right">
    <i class="fas fa-home"></i>
</button>
```

### Mensajes de Estado
```html
<!-- Éxito -->
<span data-tooltip="Operación completada exitosamente" data-tooltip-theme="success">
    ✓ Success
</span>

<!-- Error -->
<span data-tooltip="Hubo un error al procesar la solicitud" data-tooltip-theme="error">
    ✗ Error
</span>
```

## Configuración Avanzada

### CSS Personalizado

Puedes personalizar los tooltips modificando las variables CSS:

```css
:root {
    --tooltip-bg: var(--bg-primary);
    --tooltip-text: var(--text-primary);
    --tooltip-border: var(--border-color);
    --tooltip-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### JavaScript Avanzado

```javascript
// Configurar delays personalizados
tooltipManager.setDelays(300, 50); // Más rápido

// Agregar tooltip con configuración completa
tooltipManager.addTooltip(document.getElementById('my-button'), 'Mi tooltip', {
    position: 'bottom',
    theme: 'success'
});

// Manejar tooltips dinámicos
document.addEventListener('DOMContentLoaded', () => {
    // Refrescar tooltips después de cargar contenido dinámico
    tooltipManager.refresh();
});
```

## Mejores Prácticas

1. **Texto Conciso**: Mantén los tooltips cortos y descriptivos
2. **Posicionamiento**: Usa `right` para elementos del navbar izquierdo, `top`/`bottom` para botones horizontales
3. **Temas Apropiados**: Usa `success` para confirmaciones, `error` para advertencias
4. **Accesibilidad**: Asegúrate de que la información del tooltip esté disponible por otros medios para usuarios con screen readers
5. **Rendimiento**: Evita tooltips en elementos que se actualizan frecuentemente

## Integración con Componentes

El sistema está integrado automáticamente con:

- **Navbar**: Tooltips en elementos colapsados
- **Timer**: Tooltips explicativos en botones de control
- **Proyectos**: Tooltips informativos en acciones
- **Modales**: Tooltips en elementos de formulario (opcional)

## Troubleshooting

### Tooltip no aparece
- Verifica que el atributo `data-tooltip` esté presente
- Asegúrate de que `tooltip.css` esté cargado
- Verifica que el elemento sea visible y tenga posición

### Posición incorrecta
- El sistema auto-ajusta la posición, pero puede necesitar espacio mínimo
- Verifica el contenedor padre y sus propiedades de overflow

### Tooltip no desaparece
- Revisa eventos de JavaScript que puedan interferir
- Usa `tooltipManager.hide()` para forzar el ocultado
