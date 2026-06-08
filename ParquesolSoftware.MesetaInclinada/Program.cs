using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using ParquesolSoftware.MesetaInclinada;
using ParquesolSoftware.MesetaInclinada.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// Servicios de Firebase
builder.Services.AddScoped<FirestoreService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<StorageService>();
builder.Services.AddScoped<LeafletService>();
builder.Services.AddScoped<RutasSecundariasService>();
builder.Services.AddScoped<MapsService>();

await builder.Build().RunAsync();
