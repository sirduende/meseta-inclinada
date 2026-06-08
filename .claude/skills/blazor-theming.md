---
description: Use when the user wants to apply a visual theme to a Blazor project, change the color scheme of an existing project, create a CSS variable system for a new project, or use the "patatas con palillos" design as a template. Also use when asked to make a project look like another one by swapping colors, when adding dark mode, or when setting up responsive breakpoints and layout classes.
---

# Blazor Visual Theming (CSS Variables Pattern)

## Core Concept

All colors and shadows are defined as CSS custom properties in `:root`. To retheme the entire app, only edit these variables — every component cascades from them automatically.

## theme.css — Complete Variable System

```css
/* ==========================================
   CSS Variables — edit here to retheme
   ========================================== */
:root {
    /* Primary palette */
    --primary:          #FFD700;   /* main accent (buttons, badges, active states) */
    --primary-dark:     #CC9900;   /* hover/pressed state of primary */
    --primary-light:    #FFF8DC;   /* backgrounds, gradient starts */

    /* Secondary accent */
    --accent:           #E07B39;   /* interactive elements, toggles on hover */

    /* Text */
    --text-dark:        #333;      /* headings, main content */
    --text-gray:        #666;      /* body text, subtitles */
    --text-muted:       #888;      /* metadata, timestamps */

    /* Surfaces */
    --bg-light:         #f8f9fa;   /* page background */
    --border-color:     #ddd;      /* card borders, dividers */

    /* Shadows */
    --shadow:           0 2px 8px rgba(0, 0, 0, 0.1);
    --shadow-hover:     0 4px 16px rgba(0, 0, 0, 0.15);
}

/* ==========================================
   Base typography
   ========================================== */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
                 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    color: var(--text-dark);
    background-color: var(--bg-light);
}
```

## Layout Classes

```css
.page-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.main-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: white;
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow);
}

.main-content {
    flex: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
    width: 100%;
}

.main-footer {
    background: var(--text-dark);
    color: white;
    text-align: center;
    padding: 1rem;
    font-size: 0.85rem;
}
```

## Card Pattern

```css
.card {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
}

/* Gradient card (stat cards, hero sections) */
.card-gradient {
    background: linear-gradient(135deg, var(--primary-light), white);
    border: 2px solid var(--primary);
    border-radius: 12px;
}
```

## Buttons

```css
.btn-primary {
    background-color: var(--primary);
    color: var(--text-dark);
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1.25rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
}

.btn-primary:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
}

.btn-secondary {
    background-color: transparent;
    color: var(--text-dark);
    border: 2px solid var(--primary);
    border-radius: 8px;
    padding: 0.5rem 1.25rem;
    font-weight: 600;
    cursor: pointer;
}

.btn-secondary:hover {
    background-color: var(--primary-light);
}
```

## Badge / Tag Pattern (e.g. two-reviewer system)

```css
/* Reviewer A */
.badge-a {
    background-color: #E3F2FD;
    color: #1976D2;
    border: 1px solid #BBDEFB;
    border-radius: 20px;
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
}

/* Reviewer B */
.badge-b {
    background-color: #FCE4EC;
    color: #C2185B;
    border: 1px solid #F8BBD0;
    border-radius: 20px;
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
}
```

## Modal Pattern

```css
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
}

.modal-dialog {
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideIn 0.2s ease;
}

.modal-header {
    background: var(--primary-light);
    border-bottom: 2px solid var(--primary);
    padding: 1.25rem 1.5rem;
    border-radius: 16px 16px 0 0;
}

.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); }
```

## Animations

```css
@keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}

@keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--primary-light);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
```

## Responsive Grid

```css
.grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
}

@media (max-width: 1200px) {
    .grid-3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .grid-3 { grid-template-columns: 1fr; }
    .main-content { padding: 1rem 0.75rem; }
}

@media (max-width: 480px) {
    .page-header h1 { font-size: 1.75rem; }
}
```

## How to Retheme a Project

To change the color scheme completely, only edit the `:root` variables:

| Goal | Variables to change |
|---|---|
| Change primary color | `--primary`, `--primary-dark`, `--primary-light` |
| Change accent/hover color | `--accent` |
| Change text colors | `--text-dark`, `--text-gray`, `--text-muted` |
| Change page background | `--bg-light` |
| Change card borders | `--border-color` |
| Adjust shadows | `--shadow`, `--shadow-hover` |

### Example: Blue theme

```css
:root {
    --primary:       #2196F3;
    --primary-dark:  #1565C0;
    --primary-light: #E3F2FD;
    --accent:        #FF9800;
    --text-dark:     #212121;
    --text-gray:     #616161;
}
```

### Example: Green theme

```css
:root {
    --primary:       #4CAF50;
    --primary-dark:  #2E7D32;
    --primary-light: #E8F5E9;
    --accent:        #FF5722;
}
```

## Loading / Error States

```css
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: var(--text-gray);
}

.error-container {
    background: #FFF3F3;
    border: 1px solid #FFCDD2;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    color: #C62828;
}
```

## CSS Load Order in index.html

```html
<link rel="stylesheet" href="lib/bootstrap/dist/css/bootstrap.min.css" />
<link rel="stylesheet" href="css/app.css" />        <!-- Blazor defaults -->
<link rel="stylesheet" href="css/theme.css" />      <!-- Variables + all styles -->
<link href="MyProject.styles.css" rel="stylesheet" /> <!-- Scoped component CSS -->
```

## Reference files in patatas-con-palillos
- `ParquesolSoftware.PatatasConPalillos/wwwroot/css/patatines.css` (1898 lines — full implementation)
- `ParquesolSoftware.PatatasConPalillos/wwwroot/css/app.css` (Blazor base styles)
- `ParquesolSoftware.PatatasConPalillos/Layout/MainLayout.razor.css` (scoped layout CSS)
- `ParquesolSoftware.PatatasConPalillos/Layout/NavMenu.razor.css` (scoped nav CSS)
