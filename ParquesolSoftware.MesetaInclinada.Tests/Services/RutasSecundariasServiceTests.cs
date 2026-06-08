using FluentAssertions;
using Microsoft.JSInterop;
using Moq;
using ParquesolSoftware.MesetaInclinada.Models;
using ParquesolSoftware.MesetaInclinada.Services;
using System.Net;
using System.Text.Json;

namespace ParquesolSoftware.MesetaInclinada.Tests.Services;

public class RutasSecundariasServiceTests
{
    private static readonly List<RutaSecundaria> RutasFake = new()
    {
        new() { NombreRuta = "Pico Picón", CumbrePrincipal = "01 Peña Trevinca", Dificultad = "Moderada", AnoRuta = 2022, ArchivoGPX = "gpx2026/01_picon.gpx", PropuestoPor = "Dani" },
        new() { NombreRuta = "Botete",     CumbrePrincipal = "02 Miravalles",     Dificultad = "Moderada", AnoRuta = 2024, ArchivoGPX = "gpx2026/02_botete.gpx", PropuestoPor = "Dani" },
        new() { NombreRuta = "El cable",   CumbrePrincipal = "12 Llambrión",      Dificultad = "Difícil",  AnoRuta = 2023, ArchivoGPX = "gpx2026/12_cable.gpx",  PropuestoPor = "Asun", Aviso = "Expuesto" }
    };

    private (HttpClient http, FirestoreService firestore) BuildDeps(List<RutaSecundaria>? data = null)
    {
        var json = JsonSerializer.Serialize(data ?? RutasFake);
        var handler = new FakeHttpHandler(json);
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };

        var js = new Mock<IJSRuntime>();
        var firestoreHttp = new HttpClient(new FakeHttpHandler("""{"apiKey":"k","authDomain":"x","projectId":"t","storageBucket":"t","messagingSenderId":"1","appId":"1"}"""))
            { BaseAddress = new Uri("http://localhost/") };
        var firestore = new FirestoreService(js.Object, firestoreHttp);

        return (http, firestore);
    }

    [Fact]
    public async Task GetAllAsync_devuelve_lista_completa()
    {
        var (http, fs) = BuildDeps();
        var svc = new RutasSecundariasService(http, fs);
        var rutas = await svc.GetAllAsync();
        rutas.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetAllAsync_deserializa_nombre_correctamente()
    {
        var (http, fs) = BuildDeps();
        var svc = new RutasSecundariasService(http, fs);
        var rutas = await svc.GetAllAsync();
        rutas.First().NombreRuta.Should().Be("Pico Picón");
    }

    [Fact]
    public async Task GetAllAsync_deserializa_aviso_opcional()
    {
        var (http, fs) = BuildDeps();
        var svc = new RutasSecundariasService(http, fs);
        var rutas = await svc.GetAllAsync();
        rutas.Single(r => r.NombreRuta == "El cable").Aviso.Should().Be("Expuesto");
        rutas.First(r => r.NombreRuta == "Pico Picón").Aviso.Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_segunda_llamada_usa_cache_sin_peticion_HTTP()
    {
        var handler = new CountingHttpHandler(JsonSerializer.Serialize(RutasFake));
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        var js = new Mock<IJSRuntime>();
        var firestoreHttp = new HttpClient(new FakeHttpHandler("""{"apiKey":"k","authDomain":"x","projectId":"t","storageBucket":"t","messagingSenderId":"1","appId":"1"}"""))
            { BaseAddress = new Uri("http://localhost/") };
        var svc = new RutasSecundariasService(http, new FirestoreService(js.Object, firestoreHttp));

        await svc.GetAllAsync();
        await svc.GetAllAsync();

        handler.CallCount.Should().Be(1);
    }

    [Fact]
    public async Task GetAllAsync_devuelve_lista_vacia_si_HTTP_falla()
    {
        var handler = new ErrorHttpHandler();
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        var js = new Mock<IJSRuntime>();
        var firestoreHttp = new HttpClient(new FakeHttpHandler("""{"apiKey":"k","authDomain":"x","projectId":"t","storageBucket":"t","messagingSenderId":"1","appId":"1"}"""))
            { BaseAddress = new Uri("http://localhost/") };
        var svc = new RutasSecundariasService(http, new FirestoreService(js.Object, firestoreHttp));

        var result = await svc.GetAllAsync();
        result.Should().BeEmpty();
    }
}

internal class FakeHttpHandler(string json) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken ct)
        => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        });
}

internal class CountingHttpHandler(string json) : HttpMessageHandler
{
    public int CallCount { get; private set; }
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken ct)
    {
        CallCount++;
        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        });
    }
}

internal class ErrorHttpHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken ct)
        => Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
}
