using Bunit;
using FluentAssertions;
using Microsoft.AspNetCore.Components;
using ParquesolSoftware.MesetaInclinada.Components;
using ParquesolSoftware.MesetaInclinada.Models;

namespace ParquesolSoftware.MesetaInclinada.Tests.Components;

public class RouteCardTests : TestContext
{
    private static RutaEnriquecida BuildRuta(
        string nombre = "Mulhacén", string nivel = "Alta", string fecha = "2025-08-15",
        double km = 25.07, double desnivel = 2047, double duracionS = 28800,
        string color = "#d62728", int index = 3,
        List<string>? participantes = null)
        => new()
        {
            Id = "1", Nombre = nombre, Nivel = nivel, Fecha = fecha,
            DistanciaKm = km, DesnivelM = desnivel, DuracionS = duracionS,
            DuracionFormateada = "8 h 0 min", Color = color, ColorIndex = color,
            Index = index,
            Participantes = participantes ?? new List<string> { "Asun", "Lolo", "Dani" }
        };

    [Fact]
    public void Muestra_nombre_de_la_ruta()
    {
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta("Peña Prieta")));
        cut.Markup.Should().Contain("Peña Prieta");
    }

    [Fact]
    public void Muestra_fecha_guion_nombre()
    {
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta("Mulhacén", fecha: "2025-08-15")));
        cut.Find(".fw-bold").TextContent.Should().Contain("2025-08-15").And.Contain("Mulhacén");
    }

    [Fact]
    public void Muestra_numero_de_participantes()
    {
        var ruta = BuildRuta(participantes: new List<string> { "Asun", "Lolo", "JuanMa" });
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, ruta));
        cut.Markup.Should().Contain("3 participantes");
    }

    [Fact]
    public void Un_participante_singular()
    {
        var ruta = BuildRuta(participantes: new List<string> { "Asun" });
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, ruta));
        cut.Markup.Should().Contain("1 participante");
        cut.Markup.Should().NotContain("1 participantes");
    }

    [Fact]
    public void Badge_muestra_Nivel_con_prefijo()
    {
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta(nivel: "Alta")));
        // El badge de nivel tiene style con background-color; el de #N tiene bg-secondary
        var nivelBadge = cut.FindAll(".badge.rounded-pill").First(b => b.HasAttribute("style"));
        nivelBadge.TextContent.Trim().Should().Be("Nivel: Alta");
    }

    [Fact]
    public void Badge_nivel_Alta_usa_rojo()
    {
        // El color del badge viene de ColorBorde (calculado desde Nivel), no de Ruta.Color
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta(nivel: "Alta")));
        var nivelBadge = cut.FindAll(".badge.rounded-pill").First(b => b.HasAttribute("style"));
        nivelBadge.GetAttribute("style").Should().Contain("#ef4444", "Alta debe ser rojo, no azul");
    }

    [Fact]
    public void Badge_nivel_Media_usa_naranja()
    {
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta(nivel: "Media")));
        var nivelBadge = cut.FindAll(".badge.rounded-pill").First(b => b.HasAttribute("style"));
        nivelBadge.GetAttribute("style").Should().Contain("#f97316");
    }

    [Fact]
    public void Badge_nivel_Baja_usa_verde()
    {
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta(nivel: "Baja")));
        var nivelBadge = cut.FindAll(".badge.rounded-pill").First(b => b.HasAttribute("style"));
        nivelBadge.GetAttribute("style").Should().Contain("#22c55e");
    }

    [Fact]
    public void Badge_nivel_no_usa_color_de_la_paleta_JS()
    {
        // Garantiza que pasar un color de paleta azul (#1f77b4) no afecta al badge de nivel
        var ruta = BuildRuta(nivel: "Alta", color: "#1f77b4");
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, ruta));
        var nivelBadge = cut.FindAll(".badge.rounded-pill").First(b => b.HasAttribute("style"));
        nivelBadge.GetAttribute("style").Should().NotContain("#1f77b4",
            "el badge usa ColorBorde (C#), no el color de paleta que llega de JS");
    }

    [Fact]
    public void Muestra_numero_de_orden()
    {
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta(index: 7)));
        cut.Find(".badge.bg-secondary").TextContent.Should().Contain("#7");
    }

    [Fact]
    public void Muestra_stats_cuando_tiene_GPX()
    {
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta(km: 25.07, desnivel: 2047)));
        cut.Markup.Should().Contain("25,1 km").And.Contain("2047 m↑");
    }

    [Fact]
    public void Sin_GPX_no_muestra_stats()
    {
        var ruta = BuildRuta(km: 0, desnivel: 0, duracionS: 0);
        ruta.DuracionFormateada = "N/A";
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, ruta));
        cut.Markup.Should().NotContain(" km ·");
    }

    [Fact]
    public void Es_un_boton_full_width()
    {
        var cut = RenderComponent<RouteCard>(p => p.Add(x => x.Ruta, BuildRuta()));
        var btn = cut.Find("button");
        btn.ClassList.Should().Contain("w-100").And.Contain("text-start");
    }

    [Fact]
    public void Click_dispara_EventCallback_OnClick()
    {
        var clickado = false;
        var cut = RenderComponent<RouteCard>(p =>
        {
            p.Add(x => x.Ruta, BuildRuta());
            p.Add(x => x.OnClick, EventCallback.Factory.Create(this, () => clickado = true));
        });
        cut.Find("button").Click();
        clickado.Should().BeTrue();
    }
}
