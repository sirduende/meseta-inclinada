using FluentAssertions;
using Microsoft.JSInterop;
using Moq;
using ParquesolSoftware.MesetaInclinada.Models;
using ParquesolSoftware.MesetaInclinada.Services;
using System.Net;
using System.Net.Http.Json;

namespace ParquesolSoftware.MesetaInclinada.Tests.Services;

public class FirestoreServiceTests
{
    private (FirestoreService service, Mock<IJSRuntime> jsMock) Build()
    {
        var js = new Mock<IJSRuntime>();
        var handler = new FakeHttpMessageHandler("""
            {"apiKey":"key","authDomain":"x.com","projectId":"test",
             "storageBucket":"test.app","messagingSenderId":"123","appId":"1:123:web:abc"}
            """);
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        return (new FirestoreService(js.Object, http), js);
    }

    [Fact]
    public async Task InitializeAsync_llama_a_firebaseInterop_initialize()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);

        var result = await svc.InitializeAsync();

        result.Should().BeTrue();
        js.Verify(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()), Times.Once);
    }

    [Fact]
    public async Task InitializeAsync_segunda_llamada_no_reinicializa()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);

        await svc.InitializeAsync();
        await svc.InitializeAsync(); // segunda vez

        js.Verify(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()), Times.Once);
    }

    [Fact]
    public async Task GetRutasAsync_devuelve_lista_vacia_si_JSInterop_falla()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<Ruta>>>("firebaseInterop.getRutasByYear", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<Ruta>> { Success = false });

        var rutas = await svc.GetRutasAsync();

        rutas.Should().BeEmpty();
    }

    [Fact]
    public async Task GetRutasAsync_con_year_pasa_parametro_a_JS()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<Ruta>>>("firebaseInterop.getRutasByYear", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<Ruta>> { Success = true, Data = new List<Ruta>() });

        await svc.GetRutasAsync(2025);

        js.Verify(x => x.InvokeAsync<FirestoreResult<List<Ruta>>>(
            "firebaseInterop.getRutasByYear",
            It.Is<object[]>(args => args.Length > 0 && Equals(args[0], 2025))), Times.Once);
    }

    [Fact]
    public async Task GetRutasAsync_devuelve_rutas_correctas()
    {
        var (svc, js) = Build();
        var rutasEsperadas = new List<Ruta>
        {
            new() { Id = "1", Nombre = "Mulhacén", Fecha = "2025-08-15" },
            new() { Id = "2", Nombre = "Castro Valnera", Fecha = "2025-09-01" }
        };

        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<Ruta>>>("firebaseInterop.getRutasByYear", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<Ruta>> { Success = true, Data = rutasEsperadas });

        var resultado = await svc.GetRutasAsync();

        resultado.Should().HaveCount(2);
        resultado[0].Nombre.Should().Be("Mulhacén");
    }

    [Fact]
    public async Task IsAdminAsync_devuelve_false_si_JSInterop_falla()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<FirestoreResult<bool>>("firebaseInterop.isAdmin", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<bool> { Success = false });

        var esAdmin = await svc.IsAdminAsync("uid-123");

        esAdmin.Should().BeFalse();
    }

    [Fact]
    public async Task IsAdminAsync_devuelve_true_cuando_roles_lo_indica()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<FirestoreResult<bool>>("firebaseInterop.isAdmin", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<bool> { Success = true, Data = true });

        var esAdmin = await svc.IsAdminAsync("uid-admin");

        esAdmin.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteRutaAsync_llama_a_JS_con_el_id_correcto()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>("firebaseInterop.deleteRuta", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = true });

        var ok = await svc.DeleteRutaAsync("42");

        ok.Should().BeTrue();
        js.Verify(x => x.InvokeAsync<FirestoreResult<object>>(
            "firebaseInterop.deleteRuta",
            It.Is<object[]>(args => args[0].ToString() == "42")), Times.Once);
    }
}

/// <summary>Fake handler para devolver el firebase-config.json sin necesitar un servidor real.</summary>
internal class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly string _json;
    public FakeHttpMessageHandler(string json) => _json = json;

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(_json, System.Text.Encoding.UTF8, "application/json")
        };
        return Task.FromResult(response);
    }
}
