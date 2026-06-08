using FluentAssertions;
using Microsoft.JSInterop;
using Moq;
using ParquesolSoftware.MesetaInclinada.Models;
using ParquesolSoftware.MesetaInclinada.Services;
using System.Net;

namespace ParquesolSoftware.MesetaInclinada.Tests.Services;

/// <summary>
/// Tests del ciclo completo de avatares en FirestoreService:
///  - Leer config (documento existente / inexistente / error JS)
///  - Leer todos los configs (colección vacía / con datos / error JS)
///  - Guardar config (nuevo documento / actualización / error de permisos / error JS)
///  - Verificación del payload enviado a JS (modelo simplificado: nombre + url)
/// </summary>
public class AvatarConfigServiceTests
{
    // ── Helper ──────────────────────────────────────────────────────────────

    private (FirestoreService service, Mock<IJSRuntime> jsMock) Build()
    {
        var js = new Mock<IJSRuntime>();
        var handler = new FakeAvatarHttpHandler("""
            {"apiKey":"key","authDomain":"x.com","projectId":"test",
             "storageBucket":"test.app","messagingSenderId":"123","appId":"1:123:web:abc"}
            """);
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };

        // Por defecto el initialize retorna true para no repetirlo en cada test
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);

        return (new FirestoreService(js.Object, http), js);
    }

    // ── GetAvatarConfigAsync ────────────────────────────────────────────────

    [Fact]
    public async Task GetAvatarConfig_devuelve_null_cuando_documento_no_existe()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<AvatarConfig>>(
                "firebaseInterop.getAvatarConfig", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<AvatarConfig> { Success = false });

        var result = await svc.GetAvatarConfigAsync("NombreInexistente");

        result.Should().BeNull("un documento que no existe en Firestore debe devolver null, no lanzar excepción");
    }

    [Fact]
    public async Task GetAvatarConfig_devuelve_config_cuando_documento_existe()
    {
        var (svc, js) = Build();
        var config = new AvatarConfig
        {
            Nombre = "Alberto",
            Url    = "https://api.dicebear.com/9.x/toon-head/svg?seed=Alberto&hair=undercut&beard=fullBeard"
        };
        js.Setup(x => x.InvokeAsync<FirestoreResult<AvatarConfig>>(
                "firebaseInterop.getAvatarConfig", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<AvatarConfig> { Success = true, Data = config });

        var result = await svc.GetAvatarConfigAsync("Alberto");

        result.Should().NotBeNull();
        result!.Nombre.Should().Be("Alberto");
        result.Url.Should().Contain("hair=undercut");
        result.Url.Should().Contain("beard=fullBeard");
    }

    [Fact]
    public async Task GetAvatarConfig_devuelve_null_si_JS_lanza_excepcion()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<AvatarConfig>>(
                "firebaseInterop.getAvatarConfig", It.IsAny<object[]>()))
          .ThrowsAsync(new JSException("The value 'firebaseInterop.getAvatarConfig' is not a function."));

        // No debe propagar la excepción — debe devolver null de forma segura
        var result = await svc.GetAvatarConfigAsync("Alberto");

        result.Should().BeNull("la página de perfil debe cargar aunque el avatar falle");
    }

    [Fact]
    public async Task GetAvatarConfig_pasa_el_nombre_como_argumento_a_JS()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<AvatarConfig>>(
                "firebaseInterop.getAvatarConfig", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<AvatarConfig> { Success = false });

        await svc.GetAvatarConfigAsync("María");

        js.Verify(x => x.InvokeAsync<FirestoreResult<AvatarConfig>>(
            "firebaseInterop.getAvatarConfig",
            It.Is<object[]>(args => args.Length > 0 && args[0].ToString() == "María")),
            Times.Once);
    }

    // ── UrlODefault ─────────────────────────────────────────────────────────

    [Fact]
    public void UrlODefault_retorna_url_guardada_cuando_existe()
    {
        var cfg = new AvatarConfig
        {
            Nombre = "Alberto",
            Url    = "https://api.dicebear.com/9.x/toon-head/svg?seed=Alberto&hair=undercut"
        };
        cfg.UrlODefault.Should().Be(cfg.Url);
    }

    [Fact]
    public void UrlODefault_genera_url_por_defecto_cuando_url_esta_vacia()
    {
        var cfg = new AvatarConfig { Nombre = "María José" };
        cfg.UrlODefault.Should().StartWith("https://api.dicebear.com/9.x/adventurer/svg");
        cfg.UrlODefault.Should().Contain("seed=Mar%C3%ADa%20Jos%C3%A9");
    }

    // ── GetAvatarConfigsAsync ───────────────────────────────────────────────

    [Fact]
    public async Task GetAvatarConfigs_devuelve_lista_vacia_si_coleccion_vacia()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<AvatarConfig>>>(
                "firebaseInterop.getAvatarConfigs", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<AvatarConfig>> { Success = true, Data = new() });

        var result = await svc.GetAvatarConfigsAsync();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAvatarConfigs_devuelve_todos_los_configs_guardados()
    {
        var (svc, js) = Build();
        var lista = new List<AvatarConfig>
        {
            new() { Nombre = "Alberto", Url = "https://api.dicebear.com/9.x/toon-head/svg?seed=Alberto" },
            new() { Nombre = "María",   Url = "https://api.dicebear.com/9.x/toon-head/svg?seed=Mar%C3%ADa" },
            new() { Nombre = "Pedro",   Url = "" }
        };
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<AvatarConfig>>>(
                "firebaseInterop.getAvatarConfigs", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<AvatarConfig>> { Success = true, Data = lista });

        var result = await svc.GetAvatarConfigsAsync();

        result.Should().HaveCount(3);
        result.Select(c => c.Nombre).Should().Contain(["Alberto", "María", "Pedro"]);
    }

    [Fact]
    public async Task GetAvatarConfigs_devuelve_lista_vacia_si_JS_lanza_excepcion()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<AvatarConfig>>>(
                "firebaseInterop.getAvatarConfigs", It.IsAny<object[]>()))
          .ThrowsAsync(new JSException("The value 'firebaseInterop.getAvatarConfigs' is not a function."));

        var result = await svc.GetAvatarConfigsAsync();

        result.Should().BeEmpty("el panel admin no debe explotar si el JS falla");
    }

    // ── SaveAvatarConfigAsync ───────────────────────────────────────────────

    [Fact]
    public async Task SaveAvatarConfig_retorna_true_cuando_JS_tiene_exito()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveAvatarConfig", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = true });

        var ok = await svc.SaveAvatarConfigAsync(new AvatarConfig { Nombre = "Alberto" });

        ok.Should().BeTrue();
    }

    [Fact]
    public async Task SaveAvatarConfig_retorna_false_cuando_Firestore_deniega_permisos()
    {
        // Reproduce el escenario real: reglas no desplegadas → permission-denied → success:false
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveAvatarConfig", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = false, Error = "Missing or insufficient permissions." });

        var ok = await svc.SaveAvatarConfigAsync(new AvatarConfig { Nombre = "Alberto" });

        ok.Should().BeFalse();
    }

    [Fact]
    public async Task SaveAvatarConfig_retorna_false_si_JS_lanza_excepcion()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveAvatarConfig", It.IsAny<object[]>()))
          .ThrowsAsync(new JSException("The value 'firebaseInterop.saveAvatarConfig' is not a function."));

        var ok = await svc.SaveAvatarConfigAsync(new AvatarConfig { Nombre = "Alberto" });

        ok.Should().BeFalse("debe capturar la excepción y devolver false en lugar de explotar");
    }

    [Fact]
    public async Task SaveAvatarConfig_envía_nombre_como_id_del_documento()
    {
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveAvatarConfig", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = true });

        await svc.SaveAvatarConfigAsync(new AvatarConfig { Nombre = "Alberto" });

        // El primer argumento de JS debe ser el nombre (ID del doc en Firestore)
        js.Verify(x => x.InvokeAsync<FirestoreResult<object>>(
            "firebaseInterop.saveAvatarConfig",
            It.Is<object[]>(args => args[0].ToString() == "Alberto")),
            Times.Once);
    }

    [Fact]
    public async Task SaveAvatarConfig_payload_contiene_nombre_y_url()
    {
        var (svc, js) = Build();
        object? capturedPayload = null;

        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveAvatarConfig", It.IsAny<object[]>()))
          .Callback<string, object[]>((_, args) => capturedPayload = args[1])
          .ReturnsAsync(new FirestoreResult<object> { Success = true });

        var config = new AvatarConfig
        {
            Nombre = "Pedro",
            Url    = "https://api.dicebear.com/9.x/toon-head/svg?seed=Pedro&hair=spiky&beard=moustacheTwirl"
        };

        await svc.SaveAvatarConfigAsync(config);

        capturedPayload.Should().NotBeNull();
        var type = capturedPayload!.GetType();
        type.GetProperty("nombre")?.GetValue(capturedPayload).Should().Be("Pedro");
        type.GetProperty("url")?.GetValue(capturedPayload).Should().Be(config.Url);
    }

    [Fact]
    public async Task SaveAvatarConfig_documento_nuevo_usa_mismo_flujo_que_actualizacion()
    {
        // Firestore set() con merge:true funciona igual para docs nuevos y existentes.
        var (svc, js) = Build();
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveAvatarConfig", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = true });

        var cfgNuevo     = new AvatarConfig { Nombre = "NuevoMiembro", Url = "" };
        var cfgExistente = new AvatarConfig { Nombre = "Alberto", Url = "https://api.dicebear.com/9.x/toon-head/svg?seed=Alberto&hair=bun&beard=fullBeard" };

        var okNuevo     = await svc.SaveAvatarConfigAsync(cfgNuevo);
        var okExistente = await svc.SaveAvatarConfigAsync(cfgExistente);

        okNuevo.Should().BeTrue("crear un doc nuevo debe funcionar igual que actualizar");
        okExistente.Should().BeTrue();
        js.Verify(x => x.InvokeAsync<FirestoreResult<object>>(
            "firebaseInterop.saveAvatarConfig", It.IsAny<object[]>()), Times.Exactly(2));
    }
}

/// <summary>Fake handler para devolver el firebase-config.json sin un servidor real.</summary>
internal class FakeAvatarHttpHandler : HttpMessageHandler
{
    private readonly string _json;
    public FakeAvatarHttpHandler(string json) => _json = json;

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(_json, System.Text.Encoding.UTF8, "application/json")
        });
}
