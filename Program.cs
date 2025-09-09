using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Servir archivos de la raíz y /libs
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory())),
    ServeUnknownFileTypes = true // para extensiones no registradas
});

// Servir GPX desde /gpx
var gpxPath = Path.Combine(Directory.GetCurrentDirectory(), "public/gpx");

// Registrar .gpx como application/gpx+xml
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".gpx"] = "application/gpx+xml";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(gpxPath),
    RequestPath = "/public/gpx",
    ContentTypeProvider = provider
});

// opcional: ver listado de archivos
app.UseDirectoryBrowser(new DirectoryBrowserOptions
{
    FileProvider = new PhysicalFileProvider(gpxPath),
    RequestPath = "/public/gpx"
});

app.Run();
