using Bunit;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;
using Moq;
using ParquesolSoftware.MesetaInclinada.Pages.Admin;
using ParquesolSoftware.MesetaInclinada.Services;

namespace ParquesolSoftware.MesetaInclinada.Tests.Components;

/// <summary>
/// Tests del laboratorio de avatares (AvatarLab.razor) — DiceBear Adventurer.
/// AuthService.IsAdmin = false → la sección "Guardar" no se renderiza,
/// por lo que no hay selects extra y los índices son predecibles.
/// </summary>
public class AvatarLabTests : TestContext
{
    // ── Índices de los selects (cuando IsAdmin=false no aparece el select de miembro) ──
    private const int SelectHair      = 0;
    private const int SelectEyes      = 1;
    private const int SelectEyebrows  = 2;
    private const int SelectMouth     = 3;
    private const int SelectGlasses   = 4;
    private const int SelectEarrings  = 5;

    private IRenderedComponent<AvatarLab> Render()
    {
        Services.AddSingleton(new Mock<IJSRuntime>().Object);

        var fsMock = new Mock<FirestoreService>(
            new Mock<IJSRuntime>().Object,
            new System.Net.Http.HttpClient());
        Services.AddSingleton(fsMock.Object);

        var authMock = new Mock<AuthService>(
            new Mock<IJSRuntime>().Object,
            fsMock.Object);
        authMock.Setup(a => a.IsAdmin).Returns(false);
        authMock.Setup(a => a.IsAuthenticated).Returns(false);
        Services.AddSingleton(authMock.Object);

        return RenderComponent<AvatarLab>();
    }

    // ── Estado inicial ────────────────────────────────────────────────────────

    [Fact]
    public void Estado_Inicial_UrlContieneApiDiceBearAdventurer()
    {
        var cut = Render();
        cut.Find("img#avatar-preview")
           .GetAttribute("src")
           .Should().StartWith("https://api.dicebear.com/9.x/adventurer/svg");
    }

    [Fact]
    public void Estado_Inicial_NoContieneParamsToonHead()
    {
        var cut = Render();
        var src = cut.Find("img#avatar-preview").GetAttribute("src")!;
        src.Should().NotContain("toon-head");
        src.Should().NotContain("rearHair");
        src.Should().NotContain("beard");
        src.Should().NotContain("clothes");
    }

    [Fact]
    public void Estado_Inicial_SinGafas_NoContieneGlassesParam()
    {
        var cut = Render();
        cut.Find("img#avatar-preview")
           .GetAttribute("src")
           .Should().NotContain("glasses=");
    }

    [Fact]
    public void Estado_Inicial_SinPendientes_NoContieneEarringsParam()
    {
        var cut = Render();
        cut.Find("img#avatar-preview")
           .GetAttribute("src")
           .Should().NotContain("earrings=");
    }

    // ── Pelo ──────────────────────────────────────────────────────────────────

    [Fact]
    public void SeleccionarPelo_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("select")[SelectHair].Change("short05");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("hair=short05");
    }

    [Fact]
    public void SeleccionarPeloLargo_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("select")[SelectHair].Change("long12");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("hair=long12");
    }

    [Fact]
    public void PeloVacio_NoIncluirHairParam()
    {
        var cut = Render();
        cut.FindAll("select")[SelectHair].Change(string.Empty);
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().NotContain("hair=");
    }

    // ── Ojos ──────────────────────────────────────────────────────────────────

    [Fact]
    public void SeleccionarOjos_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("select")[SelectEyes].Change("variant05");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("eyes=variant05");
    }

    [Fact]
    public void OjosVacio_NoIncluirEyesParam()
    {
        var cut = Render();
        cut.FindAll("select")[SelectEyes].Change(string.Empty);
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().NotContain("eyes=");
    }

    // ── Cejas ─────────────────────────────────────────────────────────────────

    [Fact]
    public void SeleccionarCejas_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("select")[SelectEyebrows].Change("variant03");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("eyebrows=variant03");
    }

    // ── Boca ──────────────────────────────────────────────────────────────────

    [Fact]
    public void SeleccionarBoca_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("select")[SelectMouth].Change("variant10");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("mouth=variant10");
    }

    // ── Gafas ─────────────────────────────────────────────────────────────────

    [Fact]
    public void SeleccionarGafas_AnadeGlassesProbability100()
    {
        var cut = Render();
        cut.FindAll("select")[SelectGlasses].Change("variant01");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("glassesProbability=100");
    }

    [Fact]
    public void SeleccionarEstiloGafas_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("select")[SelectGlasses].Change("variant03");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("glasses=variant03");
    }

    [Fact]
    public void SinGafas_NoContieneGlassesParam()
    {
        var cut = Render();
        cut.FindAll("select")[SelectGlasses].Change(string.Empty);
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().NotContain("glasses=");
    }

    // ── Pendientes ────────────────────────────────────────────────────────────

    [Fact]
    public void SeleccionarPendientes_AnadeEarringsProbability100()
    {
        var cut = Render();
        cut.FindAll("select")[SelectEarrings].Change("variant01");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("earringsProbability=100");
    }

    [Fact]
    public void SeleccionarEstiloPendientes_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("select")[SelectEarrings].Change("variant02");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("earrings=variant02");
    }

    // ── Rasgos faciales ───────────────────────────────────────────────────────

    [Fact]
    public void ActivarBigote_AnadeFeaturesMustache()
    {
        var cut = Render();
        cut.Find("input#chk-mustache").Change(true);
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("features=mustache");
    }

    [Fact]
    public void ActivarRubor_AnadeFeaturesBlush()
    {
        var cut = Render();
        cut.Find("input#chk-blush").Change(true);
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("features=blush");
    }

    [Fact]
    public void ActivarPecas_AnadeFeaturesFreckles()
    {
        var cut = Render();
        cut.Find("input#chk-freckles").Change(true);
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("features=freckles");
    }

    [Fact]
    public void VariosRasgos_TodasApareceenEnUrl()
    {
        var cut = Render();
        cut.Find("input#chk-mustache").Change(true);
        cut.Find("input#chk-blush").Change(true);
        var src = cut.Find("img#avatar-preview").GetAttribute("src")!;
        src.Should().Contain("mustache");
        src.Should().Contain("blush");
        src.Should().Contain("featuresProbability=100");
    }

    [Fact]
    public void SinRasgos_NoContendrFeaturesParam()
    {
        var cut = Render();
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().NotContain("features=");
    }

    // ── Colores ───────────────────────────────────────────────────────────────

    [Fact]
    public void ClickColorPelo_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("button[title='Rubio']").First().Click();
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("hairColor=e5d7a1");
    }

    [Fact]
    public void ClickColorPiel_ActualizaImgSrc()
    {
        var cut = Render();
        cut.FindAll("button[title='Oscura']").First().Click();
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("skinColor=763900");
    }

    // ── Resetear ──────────────────────────────────────────────────────────────

    [Fact]
    public void Resetear_QuitaGafas()
    {
        var cut = Render();
        cut.FindAll("select")[SelectGlasses].Change("variant02");
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("glassesProbability=100");

        cut.Find("button#btn-resetear").Click();
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().NotContain("glasses=");
    }

    [Fact]
    public void Resetear_QuitaRasgos()
    {
        var cut = Render();
        cut.Find("input#chk-mustache").Change(true);
        cut.Find("button#btn-resetear").Click();
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().NotContain("features=");
    }

    [Fact]
    public void Resetear_MantieneUrlAdventurer()
    {
        var cut = Render();
        cut.FindAll("select")[SelectHair].Change("long05");
        cut.Find("button#btn-resetear").Click();
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().StartWith("https://api.dicebear.com/9.x/adventurer/svg");
    }

    // ── URL visible en DOM ────────────────────────────────────────────────────

    [Fact]
    public void SeleccionarPelo_ActualizaUrlEnDetails()
    {
        var cut = Render();
        cut.FindAll("select")[SelectHair].Change("short03");
        cut.Find(".font-monospace").TextContent
           .Should().Contain("hair=short03");
    }

    // ── CargarDesdeUrl (parseo de URL) ────────────────────────────────────────

    [Fact]
    public void CargarDesdeUrl_ExtraeHair()
    {
        var cut = Render();
        cut.Instance.CargarDesdeUrl(
            "https://api.dicebear.com/9.x/adventurer/svg?seed=test&hair=long10");
        cut.Render();
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("hair=long10");
    }

    [Fact]
    public void CargarDesdeUrl_ExtraeGafas()
    {
        var cut = Render();
        cut.Instance.CargarDesdeUrl(
            "https://api.dicebear.com/9.x/adventurer/svg?seed=test&glasses=variant02&glassesProbability=100");
        cut.Render();
        cut.Find("img#avatar-preview").GetAttribute("src")
           .Should().Contain("glasses=variant02");
    }

    [Fact]
    public void CargarDesdeUrl_ExtraeFeatures()
    {
        var cut = Render();
        cut.Instance.CargarDesdeUrl(
            "https://api.dicebear.com/9.x/adventurer/svg?seed=test&features=mustache,blush&featuresProbability=100");
        cut.Render();
        var src = cut.Find("img#avatar-preview").GetAttribute("src")!;
        src.Should().Contain("mustache");
        src.Should().Contain("blush");
    }

    [Fact]
    public void CargarDesdeUrl_UrlVacia_NoLanzaExcepcion()
    {
        var cut = Render();
        var act = () => cut.Instance.CargarDesdeUrl(string.Empty);
        act.Should().NotThrow();
    }
}
