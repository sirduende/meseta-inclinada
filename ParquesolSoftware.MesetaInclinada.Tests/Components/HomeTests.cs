using Bunit;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;
using Moq;
using ParquesolSoftware.MesetaInclinada.Models;
using ParquesolSoftware.MesetaInclinada.Pages;
using ParquesolSoftware.MesetaInclinada.Services;
using System.Net;

namespace ParquesolSoftware.MesetaInclinada.Tests.Components;

public class HomeTests : TestContext
{
    public HomeTests()
    {
        // Home.razor inyecta FirestoreService para calcular la media de participantes
        var js = new Mock<IJSRuntime>();
        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        // GetRutasAsync devuelve lista vacía — suficiente para que la Home renderice
        js.Setup(x => x.InvokeAsync<FirestoreResult<List<Ruta>>>(
                "firebaseInterop.getRutasByYear", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<List<Ruta>> { Success = true, Data = new List<Ruta>() });

        var handler = new FakeHomeHttpHandler("""
            {"apiKey":"k","authDomain":"x","projectId":"t",
             "storageBucket":"t","messagingSenderId":"1","appId":"1"}
            """);
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        Services.AddSingleton(new FirestoreService(js.Object, http));
    }

    [Fact]
    public void Renderiza_header_con_titulo_del_grupo()
    {
        var cut = RenderComponent<Home>();
        cut.Find("header h1").TextContent.Should().Contain("Autogestión");
    }

    [Fact]
    public void No_tiene_pestanas_todo_en_pagina_unica()
    {
        var cut = RenderComponent<Home>();
        cut.FindAll(".nav-tabs").Should().BeEmpty();
        cut.FindAll(".tab-pane").Should().BeEmpty();
    }

    [Fact]
    public void Muestra_seccion_quienes_somos()
    {
        var cut = RenderComponent<Home>();
        cut.Markup.Should().Contain("¿Quiénes somos?");
        cut.Markup.Should().Contain("autogestionado");
    }

    [Fact]
    public void Decalogo_tiene_diez_items()
    {
        var cut = RenderComponent<Home>();
        var items = cut.FindAll(".decalogo-item");
        items.Should().HaveCount(10);
    }

    [Fact]
    public void Hall_of_fame_no_esta_en_home_sino_en_pagina_propia()
    {
        var cut = RenderComponent<Home>();
        cut.Markup.Should().NotContain("Asun F.S.");
        cut.Markup.Should().NotContain("Pedro A.M.R.");
    }

    [Fact]
    public void Muestra_cta_de_contacto()
    {
        var cut = RenderComponent<Home>();
        cut.Markup.Should().Contain("Escríbenos sin compromiso");
        cut.Find("a[href='mailto:mesetainclinada@gmail.com']").Should().NotBeNull();
    }

    [Fact]
    public void Muestra_resumen_del_reto_2026_con_enlace()
    {
        var cut = RenderComponent<Home>();
        cut.Markup.Should().Contain("Reto 2026");
        cut.Find("a[href='/secundarios']").Should().NotBeNull();
    }

    [Fact]
    public void Enlace_de_contacto_apunta_al_email()
    {
        var cut = RenderComponent<Home>();
        var emailLinks = cut.FindAll("a[href^='mailto:']");
        emailLinks.Should().NotBeEmpty();
        emailLinks.First().GetAttribute("href").Should().Be("mailto:mesetainclinada@gmail.com");
    }

    [Fact]
    public void Boton_rutas_realizadas_navega_a_slash_rutas()
    {
        var cut = RenderComponent<Home>();
        var link = cut.Find("a[href='/rutas']");
        link.TextContent.Should().Contain("Rutas realizadas");
    }
}

internal class FakeHomeHttpHandler(string json) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken ct)
        => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        });
}
