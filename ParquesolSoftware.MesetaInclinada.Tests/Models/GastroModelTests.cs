using FluentAssertions;
using ParquesolSoftware.MesetaInclinada.Models;

namespace ParquesolSoftware.MesetaInclinada.Tests.Models;

public class GastroModelTests
{
    // ── SitioGastro.GoogleMapsUrl ─────────────────────────────────────────────

    [Fact]
    public void GoogleMapsUrl_usa_placeId_cuando_disponible()
    {
        var sitio = new SitioGastro
        {
            PlaceId = "ChIJN1t_tDeuEmsRUsoyG83frY4",
            Lat = 40.4,
            Lng = -3.7
        };

        sitio.GoogleMapsUrl.Should().Contain("place_id:ChIJN1t_tDeuEmsRUsoyG83frY4");
        sitio.GoogleMapsUrl.Should().NotContain("40.4");
    }

    [Fact]
    public void GoogleMapsUrl_usa_coordenadas_como_fallback()
    {
        var sitio = new SitioGastro
        {
            PlaceId = string.Empty,
            Lat = 41.6523,
            Lng = -4.7245
        };

        sitio.GoogleMapsUrl.Should().Contain("41.6523");
        sitio.GoogleMapsUrl.Should().Contain("-4.7245");
    }

    [Fact]
    public void GoogleMapsUrl_coordenadas_usan_punto_decimal_invariant()
    {
        var sitio = new SitioGastro { PlaceId = string.Empty, Lat = 41.5, Lng = -4.2 };

        sitio.GoogleMapsUrl.Should().Contain("41.5").And.Contain("-4.2");
        sitio.GoogleMapsUrl.Should().NotContain("41,5");
    }

    // ── SitioGastro campos de agregados ──────────────────────────────────────

    [Fact]
    public void SitioGastro_valoracion_media_defecto_es_cero()
    {
        var sitio = new SitioGastro();
        sitio.ValoracionMedia.Should().Be(0);
        sitio.NumResenas.Should().Be(0);
    }

    [Fact]
    public void SitioGastro_ultimo_comentario_es_nullable()
    {
        var sitio = new SitioGastro();
        sitio.UltimoComentario.Should().BeNull();
        sitio.UltimoAutor.Should().BeNull();
    }

    // ── ResenaGastro ──────────────────────────────────────────────────────────

    [Fact]
    public void ResenaGastro_valores_defecto_correctos()
    {
        var r = new ResenaGastro();
        r.Uid.Should().BeEmpty();
        r.NombreUsuario.Should().BeEmpty();
        r.Estrellas.Should().Be(0);
        r.Comentario.Should().BeEmpty();
        r.Fecha.Should().BeEmpty();
        r.SitioId.Should().BeNull();
    }

    [Fact]
    public void ResenaGastro_admite_estrellas_de_uno_a_cinco()
    {
        for (int i = 1; i <= 5; i++)
        {
            var r = new ResenaGastro { Estrellas = i };
            r.Estrellas.Should().Be(i);
        }
    }

    // ── Gastronomia.EstrellasTxt (lógica de presentación) ────────────────────

    [Theory]
    [InlineData(5.0, "★★★★★")]
    [InlineData(4.0, "★★★★☆")]
    [InlineData(3.5, "★★★★☆")]  // Math.Round(3.5) = 4 (redondeo banker → 4)
    [InlineData(2.4, "★★☆☆☆")]
    [InlineData(0.0, "☆☆☆☆☆")]
    public void EstrellasTxt_genera_cadena_correcta(double valoracion, string esperado)
    {
        var resultado = SitioGastro.EstrellasTxt(valoracion);
        resultado.Should().Be(esperado);
    }

    [Fact]
    public void EstrellasTxt_cinco_estrellas_son_cinco_llenas()
    {
        SitioGastro.EstrellasTxt(5).Should().Be("★★★★★");
    }

    [Fact]
    public void EstrellasTxt_cero_devuelve_cinco_vacias()
    {
        SitioGastro.EstrellasTxt(0).Should().Be("☆☆☆☆☆");
    }

    [Fact]
    public void EstrellasTxt_longitud_siempre_cinco()
    {
        foreach (var v in new[] { 0.0, 1.0, 2.5, 4.0, 5.0 })
            SitioGastro.EstrellasTxt(v).Should().HaveLength(5);
    }
}
