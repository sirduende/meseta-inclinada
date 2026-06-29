using FluentAssertions;
using ParquesolSoftware.MesetaInclinada.Models;

namespace ParquesolSoftware.MesetaInclinada.Tests.Models;

public class RutaSecundariaModelTests
{
    // ── EsLibre ───────────────────────────────────────────────────────────────

    [Fact]
    public void EsLibre_true_cuando_tipoPropuesta_es_libre()
    {
        var r = new RutaSecundaria { TipoPropuesta = "libre", CumbrePrincipal = "Peña del Águila" };
        r.EsLibre.Should().BeTrue();
    }

    [Fact]
    public void EsLibre_true_cuando_cumbrePrincipal_es_FueraDeReto()
    {
        var r = new RutaSecundaria { TipoPropuesta = "secundario", CumbrePrincipal = "Fuera de Reto" };
        r.EsLibre.Should().BeTrue();
    }

    [Fact]
    public void EsLibre_false_cuando_es_secundario_con_cumbre()
    {
        var r = new RutaSecundaria { TipoPropuesta = "secundario", CumbrePrincipal = "01 Peña Trevinca" };
        r.EsLibre.Should().BeFalse();
    }

    [Fact]
    public void EsLibre_defecto_es_false_tipoPropuesta_secundario()
    {
        var r = new RutaSecundaria();
        r.EsLibre.Should().BeFalse();
    }

    // ── DificultadColor ───────────────────────────────────────────────────────

    [Theory]
    [InlineData("Fácil",       "#22c55e")]
    [InlineData("Moderada",    "#f97316")]
    [InlineData("Difícil",     "#ef4444")]
    [InlineData("Muy difícil", "#1f2937")]
    [InlineData("",            "#6b7280")]
    [InlineData("Desconocida", "#6b7280")]
    public void DificultadColor_devuelve_color_correcto(string dificultad, string colorEsperado)
    {
        var r = new RutaSecundaria { Dificultad = dificultad };
        r.DificultadColor.Should().Be(colorEsperado);
    }

    // ── NumeroOrden ───────────────────────────────────────────────────────────

    [Theory]
    [InlineData("01 Peña Trevinca",  1)]
    [InlineData("12 Pico Almanzor",  12)]
    [InlineData("100 Sierra Nevada", 100)]
    public void NumeroOrden_extrae_prefijo_numerico(string cumbre, int esperado)
    {
        var r = new RutaSecundaria { CumbrePrincipal = cumbre };
        r.NumeroOrden.Should().Be(esperado);
    }

    [Theory]
    [InlineData("Fuera de Reto")]
    [InlineData("")]
    [InlineData("Sin prefijo numérico")]
    public void NumeroOrden_sin_prefijo_devuelve_999(string cumbre)
    {
        var r = new RutaSecundaria { CumbrePrincipal = cumbre };
        r.NumeroOrden.Should().Be(999);
    }
}
