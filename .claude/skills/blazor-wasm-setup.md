---
description: Use when the user wants to create a new Blazor WebAssembly project from scratch, scaffold a new Blazor WASM app with Firebase, or set up the base structure of a Blazor WASM project (folder layout, DI, routing, layout). Also triggers when asked to replicate the "patatas con palillos" project structure in a new context.
---

# Blazor WebAssembly Project Setup (Firebase Pattern)

## Project Structure

```
MyProject/
├── MyProject/                          # Blazor WASM project
│   ├── Components/                     # Reusable components (cards, modals, buttons)
│   ├── Layout/
│   │   ├── MainLayout.razor
│   │   ├── MainLayout.razor.css
│   │   ├── NavMenu.razor
│   │   └── NavMenu.razor.css
│   ├── Models/                         # Domain models (POCOs with JsonPropertyName)
│   ├── Pages/                          # Routed pages (@page directive)
│   │   └── Admin/                      # Sub-folder for admin pages
│   ├── Services/                       # Business logic services
│   ├── wwwroot/
│   │   ├── css/
│   │   │   ├── app.css                 # Blazor defaults + base typography
│   │   │   └── theme.css               # CSS variables + all app styles
│   │   ├── js/
│   │   │   └── firebase-interop.js     # Firebase SDK wrapper
│   │   ├── data/                       # Static JSON files (config loaded at runtime)
│   │   ├── lib/bootstrap/              # Bootstrap 5
│   │   ├── firebase-config.json        # NOT in git — runtime config
│   │   └── index.html
│   ├── _Imports.razor
│   ├── App.razor
│   └── Program.cs
└── MyProject.IntegrationTests/         # NUnit test project
```

## Program.cs — DI Registration

```csharp
var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp =>
    new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// Firebase services (order matters: FirestoreService first, others depend on it)
builder.Services.AddScoped<FirestoreService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<StorageService>();

// Business logic services
builder.Services.AddScoped<MyDomainService>();

await builder.Build().RunAsync();
```

## App.razor

```razor
<Router AppAssembly="typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="routeData" DefaultLayout="typeof(Layout.MainLayout)" />
        <FocusOnNavigate RouteData="routeData" Selector="h1" />
    </Found>
</Router>
```

## _Imports.razor

```razor
@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.JSInterop
@using MyProject
@using MyProject.Layout
@using MyProject.Models
@using MyProject.Services
```

## index.html — CSS/JS load order

```html
<head>
    <link rel="stylesheet" href="lib/bootstrap/dist/css/bootstrap.min.css" />
    <link rel="stylesheet" href="css/app.css" />
    <link rel="stylesheet" href="css/theme.css" />
    <link href="MyProject.styles.css" rel="stylesheet" />
</head>
<body>
    <div id="app">...</div>

    <!-- Firebase SDK (compat version for interop pattern) -->
    <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-storage-compat.js"></script>
    <script src="js/firebase-interop.js"></script>

    <script src="_framework/blazor.webassembly.js"></script>
</body>
```

## Routing & Authorization Guard Pattern

```razor
@page "/admin"
@inject AuthService Auth
@inject NavigationManager Nav

@if (!Auth.IsAuthorized)
{
    <p>No autorizado.</p>
    return;
}

<!-- admin content here -->

@code {
    protected override async Task OnInitializedAsync()
    {
        if (!Auth.IsAuthorized)
            Nav.NavigateTo("/");
    }
}
```

## Auth State Subscription Pattern (IDisposable)

```razor
@implements IDisposable
@inject AuthService Auth

@code {
    protected override void OnInitialized()
    {
        Auth.AuthStateChanged += OnAuthChanged;
    }

    private void OnAuthChanged(UserInfo? user)
    {
        InvokeAsync(StateHasChanged);
    }

    public void Dispose()
    {
        Auth.AuthStateChanged -= OnAuthChanged;
    }
}
```

## MainLayout.razor

```razor
@inherits LayoutComponentBase

<div class="page-container">
    <header class="main-header">
        <NavMenu />
    </header>
    <main class="main-content">
        @Body
    </main>
    <footer class="main-footer">
        <!-- footer content -->
    </footer>
</div>
```

## firebase.json (Hosting + SPA rewrite)

```json
{
  "hosting": {
    "public": "bin/Release/net10.0/publish/wwwroot",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|png|gif|webp|svg|ico)",
        "headers": [{ "key": "Cache-Control", "value": "max-age=604800" }]
      },
      {
        "source": "**/*.@(js|css|wasm)",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/index.html",
        "headers": [{ "key": "Cache-Control", "value": "no-store" }]
      }
    ]
  }
}
```

## Reference files in patatas-con-palillos
- `ParquesolSoftware.PatatasConPalillos/Program.cs`
- `ParquesolSoftware.PatatasConPalillos/App.razor`
- `ParquesolSoftware.PatatasConPalillos/_Imports.razor`
- `ParquesolSoftware.PatatasConPalillos/Layout/MainLayout.razor`
- `ParquesolSoftware.PatatasConPalillos/wwwroot/index.html`
- `ParquesolSoftware.PatatasConPalillos/firebase.json`
