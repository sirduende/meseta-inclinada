using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

public class Miembro
{
    [JsonPropertyName("uid")]
    public string Uid { get; set; } = "";

    [JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [JsonPropertyName("nombreMostrado")]
    public string NombreMostrado { get; set; } = "";

    [JsonPropertyName("esAdmin")]
    public bool EsAdmin { get; set; }
}

public class Invitacion
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [JsonPropertyName("nombreMostrado")]
    public string NombreMostrado { get; set; } = "";

    [JsonPropertyName("fechaInvitacion")]
    public string FechaInvitacion { get; set; } = "";
}

public class Solicitud
{
    [JsonPropertyName("uid")]
    public string Uid { get; set; } = "";

    [JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = "";

    [JsonPropertyName("fechaSolicitud")]
    public string FechaSolicitud { get; set; } = "";
}
