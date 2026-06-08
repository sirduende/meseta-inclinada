using Bunit;
using FluentAssertions;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;
using Moq;
using ParquesolSoftware.MesetaInclinada.Models;
using ParquesolSoftware.MesetaInclinada.Pages.Admin;
using ParquesolSoftware.MesetaInclinada.Services;

namespace ParquesolSoftware.MesetaInclinada.Tests.Components;

public class RutaFormTests : TestContext
{
    private void SetupServices()
    {
        var jsRuntime = new Mock<IJSRuntime>();
        var http = new System.Net.Http.HttpClient { BaseAddress = new Uri("http://localhost/") };
        Services.AddSingleton(jsRuntime.Object);
        Services.AddSingleton(new FirestoreService(jsRuntime.Object, http));
        Services.AddSingleton(new StorageService(jsRuntime.Object, new FirestoreService(jsRuntime.Object, http)));
    }

    [Fact]
    public void Renderiza_campos_basicos_del_formulario()
    {
        SetupServices();
        var cut = RenderComponent<RutaForm>(p =>
        {
            p.Add(x => x.Participantes, new List<string> { "Asun", "Dani" });
        });

        cut.Find("input[placeholder*='Mulhacén']").Should().NotBeNull();
        cut.Find("select").Should().NotBeNull(); // dificultad
    }

    [Fact]
    public void Con_ruta_a_editar_rellena_los_campos()
    {
        SetupServices();
        var ruta = new Ruta
        {
            Id = "5",
            Nombre = "Torre Bermeja",
            Fecha = "2025-06-15",
            Dificultad = "Alta",
            Descripcion = "Ruta espectacular",
            Participantes = new List<string> { "Asun", "Lolo" }
        };

        var cut = RenderComponent<RutaForm>(p =>
        {
            p.Add(x => x.RutaEditar, ruta);
            p.Add(x => x.Participantes, new List<string> { "Asun", "Lolo", "Dani" });
        });

        cut.Find("input[placeholder*='Mulhacén']").GetAttribute("value").Should().Be("Torre Bermeja");
        cut.Markup.Should().Contain("Editar: Torre Bermeja");
    }

    [Fact]
    public void Nueva_ruta_muestra_titulo_nueva_ruta()
    {
        SetupServices();
        var cut = RenderComponent<RutaForm>(p =>
            p.Add(x => x.Participantes, new List<string>()));
        cut.Markup.Should().Contain("Nueva ruta");
    }

    [Fact]
    public void Participantes_se_renderizan_como_checkboxes()
    {
        SetupServices();
        var cut = RenderComponent<RutaForm>(p =>
            p.Add(x => x.Participantes, new List<string> { "Asun", "Lolo", "JuanMa" }));

        var checkboxes = cut.FindAll("input[type='checkbox']");
        checkboxes.Should().HaveCount(3);
    }

    [Fact]
    public void Participantes_de_la_ruta_aparecen_marcados()
    {
        SetupServices();
        var ruta = new Ruta
        {
            Id = "1", Nombre = "Test",
            Participantes = new List<string> { "Asun" }
        };

        var cut = RenderComponent<RutaForm>(p =>
        {
            p.Add(x => x.RutaEditar, ruta);
            p.Add(x => x.Participantes, new List<string> { "Asun", "Lolo" });
        });

        var chkAsun = cut.Find("input#chk-Asun");
        chkAsun.HasAttribute("checked").Should().BeTrue();
    }

    [Fact]
    public void Boton_cancelar_invoca_OnCancelado()
    {
        SetupServices();
        var cancelado = false;
        var cut = RenderComponent<RutaForm>(p =>
        {
            p.Add(x => x.Participantes, new List<string>());
            p.Add(x => x.OnCancelado, EventCallback.Factory.Create(this, () => cancelado = true));
        });

        // El botón Cancelar es el último button[type=button] del form
        var botones = cut.FindAll("button[type='button']");
        botones.Last().Click();
        cancelado.Should().BeTrue();
    }

    [Fact]
    public void Selector_dificultad_tiene_opciones_correctas()
    {
        SetupServices();
        var cut = RenderComponent<RutaForm>(p =>
            p.Add(x => x.Participantes, new List<string>()));

        var options = cut.FindAll("select option").Select(o => o.TextContent.Trim()).ToList();
        options.Should().Contain("Baja");
        options.Should().Contain("Media");
        options.Should().Contain("Alta");
        options.Should().Contain("Ferrata");
    }
}
