using Bunit;
using FluentAssertions;
using ParquesolSoftware.MesetaInclinada.Components;

namespace ParquesolSoftware.MesetaInclinada.Tests.Components;

public class LoadingSpinnerTests : TestContext
{
    [Fact]
    public void Visible_true_renderiza_spinner()
    {
        var cut = RenderComponent<LoadingSpinner>(p => p.Add(x => x.Visible, true));
        cut.Find(".spinner-border").Should().NotBeNull();
    }

    [Fact]
    public void Visible_false_no_renderiza_nada()
    {
        var cut = RenderComponent<LoadingSpinner>(p => p.Add(x => x.Visible, false));
        cut.Markup.Trim().Should().BeEmpty();
    }

    [Fact]
    public void Con_mensaje_muestra_el_texto()
    {
        var cut = RenderComponent<LoadingSpinner>(p =>
        {
            p.Add(x => x.Visible, true);
            p.Add(x => x.Message, "Cargando rutas...");
        });
        cut.Markup.Should().Contain("Cargando rutas...");
    }

    [Fact]
    public void Sin_mensaje_no_muestra_span_de_texto()
    {
        var cut = RenderComponent<LoadingSpinner>(p => p.Add(x => x.Visible, true));
        // No debe haber un span vacío extra
        cut.FindAll("span.ms-2").Should().BeEmpty();
    }

    [Fact]
    public void Visible_por_defecto_es_true()
    {
        var cut = RenderComponent<LoadingSpinner>();
        cut.Find(".spinner-border").Should().NotBeNull();
    }
}
