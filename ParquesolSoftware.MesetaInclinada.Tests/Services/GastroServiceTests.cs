using FluentAssertions;
using Microsoft.JSInterop;
using Moq;
using ParquesolSoftware.MesetaInclinada.Models;
using ParquesolSoftware.MesetaInclinada.Services;
using System.Net;

namespace ParquesolSoftware.MesetaInclinada.Tests.Services;

public class GastroServiceTests
{
    private (FirestoreService service, Mock<IJSRuntime> jsMock) Build()
    {
        var js = new Mock<IJSRuntime>();
        var handler = new FakeGastroHttpHandler("""
            {"apiKey":"key","authDomain":"x.com","projectId":"test",
             "storageBucket":"test.app","messagingSenderId":"123","appId":"1:123:web:abc"}
            """);
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        return (new FirestoreService(js.Object, http), js);
    }

    // ── GetGastroSitiosAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task GetGastroSitiosAsync_devuelve_lista_correcta()
    {
        var (svc, js) = Build();
        var sitiosEsperados = new List<SitioGastro>
        {
            new() { FirestoreId = "abc", Nombre = "El Asador", Direccion = "Calle Mayor 1" },
            new() { FirestoreId = "def", Nombre = "La Taberna", ValoracionMedia = 4.5, NumResenas = 3 }
        };
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<SitioGastro>>>(
                "firebaseInterop.getGastroSitios", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<SitioGastro>> { Success = true, Data = sitiosEsperados });

        var resultado = await svc.GetGastroSitiosAsync();

        resultado.Should().HaveCount(2);
        resultado[0].Nombre.Should().Be("El Asador");
        resultado[1].ValoracionMedia.Should().Be(4.5);
    }

    [Fact]
    public async Task GetGastroSitiosAsync_devuelve_vacia_si_JS_falla()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<SitioGastro>>>(
                "firebaseInterop.getGastroSitios", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<SitioGastro>> { Success = false });

        var resultado = await svc.GetGastroSitiosAsync();

        resultado.Should().BeEmpty();
    }

    [Fact]
    public async Task GetGastroSitiosAsync_devuelve_vacia_si_JS_lanza_excepcion()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<SitioGastro>>>(
                "firebaseInterop.getGastroSitios", It.IsAny<object[]>()))
          .ThrowsAsync(new Exception("Network error"));

        var resultado = await svc.GetGastroSitiosAsync();

        resultado.Should().BeEmpty();
    }

    // ── GetResenasGastroAsync ─────────────────────────────────────────────────

    [Fact]
    public async Task GetResenasGastroAsync_devuelve_resenas_del_sitio()
    {
        var (svc, js) = Build();
        var resenas = new List<ResenaGastro>
        {
            new() { Uid = "uid1", NombreUsuario = "Dani", Estrellas = 4, Comentario = "Muy bueno" },
            new() { Uid = "uid2", NombreUsuario = "Asun", Estrellas = 5 }
        };
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<ResenaGastro>>>(
                "firebaseInterop.getResenasGastro", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<ResenaGastro>> { Success = true, Data = resenas });

        var resultado = await svc.GetResenasGastroAsync("sitio-id");

        resultado.Should().HaveCount(2);
        resultado[0].Estrellas.Should().Be(4);
        resultado[1].NombreUsuario.Should().Be("Asun");
    }

    [Fact]
    public async Task GetResenasGastroAsync_pasa_sitioId_al_JS()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<ResenaGastro>>>(
                "firebaseInterop.getResenasGastro", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<ResenaGastro>> { Success = true, Data = new() });

        await svc.GetResenasGastroAsync("mi-sitio-123");

        js.Verify(x => x.InvokeAsync<FirestoreResult<List<ResenaGastro>>>(
            "firebaseInterop.getResenasGastro",
            It.Is<object[]>(args => args[0].ToString() == "mi-sitio-123")), Times.Once);
    }

    // ── GetMisResenasGastroAsync ──────────────────────────────────────────────

    [Fact]
    public async Task GetMisResenasGastroAsync_pasa_uid_al_JS()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<ResenaGastro>>>(
                "firebaseInterop.getMyResenasGastro", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<ResenaGastro>> { Success = true, Data = new() });

        await svc.GetMisResenasGastroAsync("uid-usuario");

        js.Verify(x => x.InvokeAsync<FirestoreResult<List<ResenaGastro>>>(
            "firebaseInterop.getMyResenasGastro",
            It.Is<object[]>(args => args[0].ToString() == "uid-usuario")), Times.Once);
    }

    // ── SaveResenaGastroAsync ─────────────────────────────────────────────────

    [Fact]
    public async Task SaveResenaGastroAsync_llama_JS_con_sitioId_y_uid()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveResenaGastro", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = true });

        var resena = new ResenaGastro
        {
            Uid = "uid-dani", NombreUsuario = "Dani",
            Estrellas = 4, Comentario = "Excelente chuletón",
            Fecha = "2026-06-21"
        };
        var ok = await svc.SaveResenaGastroAsync("sitio-abc", "uid-dani", resena);

        ok.Should().BeTrue();
        js.Verify(x => x.InvokeAsync<FirestoreResult<object>>(
            "firebaseInterop.saveResenaGastro",
            It.Is<object[]>(args =>
                args[0].ToString() == "sitio-abc" &&
                args[1].ToString() == "uid-dani")), Times.Once);
    }

    [Fact]
    public async Task SaveResenaGastroAsync_devuelve_false_si_JS_falla()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveResenaGastro", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = false, Error = "Permission denied" });

        var ok = await svc.SaveResenaGastroAsync("sitio-abc", "uid", new ResenaGastro());

        ok.Should().BeFalse();
    }

    // ── DeleteResenaGastroAsync ───────────────────────────────────────────────

    [Fact]
    public async Task DeleteResenaGastroAsync_llama_JS_con_sitioId_y_uid()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.deleteResenaGastro", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = true });

        var ok = await svc.DeleteResenaGastroAsync("sitio-abc", "uid-dani");

        ok.Should().BeTrue();
        js.Verify(x => x.InvokeAsync<FirestoreResult<object>>(
            "firebaseInterop.deleteResenaGastro",
            It.Is<object[]>(args =>
                args[0].ToString() == "sitio-abc" &&
                args[1].ToString() == "uid-dani")), Times.Once);
    }

    [Fact]
    public async Task DeleteResenaGastroAsync_devuelve_false_si_excepcion()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.deleteResenaGastro", It.IsAny<object[]>()))
          .ThrowsAsync(new Exception("Firestore error"));

        var ok = await svc.DeleteResenaGastroAsync("sitio-abc", "uid");

        ok.Should().BeFalse();
    }
}

internal class FakeGastroHttpHandler(string json) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken ct)
        => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        });
}
