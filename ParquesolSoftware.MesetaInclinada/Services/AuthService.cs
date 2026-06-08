using Microsoft.JSInterop;

namespace ParquesolSoftware.MesetaInclinada.Services;

public class AuthService
{
    private readonly IJSRuntime _jsRuntime;
    private readonly FirestoreService _firestoreService;

    public AuthService(IJSRuntime jsRuntime, FirestoreService firestoreService)
    {
        _jsRuntime = jsRuntime;
        _firestoreService = firestoreService;
    }

    public UserInfo? CurrentUser { get; private set; }
    public virtual bool IsAdmin { get; private set; }
    public virtual bool IsMember { get; private set; }   // miembro pero no admin
    public string? NombreMostrado { get; private set; }

    public virtual bool IsAuthenticated => IsAdmin || IsMember;

    public event Action<UserInfo?>? AuthStateChanged;

    public async Task<AuthResult> SignInWithGoogleAsync()
    {
        try
        {
            await _firestoreService.InitializeAsync();
            var result = await _jsRuntime.InvokeAsync<AuthResultJs>("firebaseInterop.signInWithGoogle");

            if (result.Success && result.User != null)
            {
                var rol = await _firestoreService.GetRolDataAsync(result.User.Uid);

                if (rol.IsAdmin)
                {
                    CurrentUser  = result.User;
                    IsAdmin      = true;
                    IsMember     = false;
                    NombreMostrado = rol.NombreMostrado;
                    AuthStateChanged?.Invoke(CurrentUser);
                    return new AuthResult { Success = true, User = CurrentUser };
                }

                if (rol.IsMember)
                {
                    CurrentUser  = result.User;
                    IsAdmin      = false;
                    IsMember     = true;
                    NombreMostrado = rol.NombreMostrado;
                    AuthStateChanged?.Invoke(CurrentUser);
                    return new AuthResult { Success = true, User = CurrentUser };
                }

                // Comprobar si hay invitación por email
                var invitacion = await _firestoreService.CheckInvitacionAsync(result.User.Email);
                if (invitacion != null)
                {
                    // Auto-aprobar: crear rol miembro y borrar invitación
                    var miembro = new Models.Miembro
                    {
                        Uid            = result.User.Uid,
                        Email          = result.User.Email,
                        NombreMostrado = invitacion.NombreMostrado
                    };
                    await _firestoreService.SaveMiembroAsync(result.User.Uid, miembro);
                    await _firestoreService.DeleteInvitacionAsync(result.User.Email);

                    CurrentUser    = result.User;
                    IsAdmin        = false;
                    IsMember       = true;
                    NombreMostrado = invitacion.NombreMostrado;
                    AuthStateChanged?.Invoke(CurrentUser);
                    return new AuthResult { Success = true, User = CurrentUser };
                }

                // Sin permisos ni invitación: guardar solicitud y desloguear
                await _firestoreService.SaveSolicitudAsync(result.User);
                await SignOutAsync();
                return new AuthResult
                {
                    Success = false,
                    Error = "Sin permisos. Tu solicitud de acceso ha sido enviada al administrador."
                };
            }

            return new AuthResult { Success = false, Error = result.Error ?? "Error desconocido al iniciar sesión" };
        }
        catch (Exception ex)
        {
            return new AuthResult { Success = false, Error = $"Error al iniciar sesión: {ex.Message}" };
        }
    }

    public async Task<bool> SignOutAsync()
    {
        try
        {
            var result = await _jsRuntime.InvokeAsync<AuthResultJs>("firebaseInterop.signOut");
            if (result.Success)
            {
                CurrentUser    = null;
                IsAdmin        = false;
                IsMember       = false;
                NombreMostrado = null;
                AuthStateChanged?.Invoke(null);
                return true;
            }
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error signing out: {ex.Message}");
            return false;
        }
    }

    public async Task InitializeAuthStateListenerAsync()
    {
        try
        {
            await _firestoreService.InitializeAsync();
            var dotNetReference = DotNetObjectReference.Create(this);
            await _jsRuntime.InvokeVoidAsync("firebaseInterop.onAuthStateChanged", dotNetReference);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error initializing auth state listener: {ex.Message}");
        }
    }

    [JSInvokable("OnAuthStateChanged")]
    public async void OnAuthStateChanged(UserInfo? user)
    {
        if (user != null)
        {
            var rol = await _firestoreService.GetRolDataAsync(user.Uid);
            if (rol.IsAdmin || rol.IsMember)
            {
                CurrentUser    = user;
                IsAdmin        = rol.IsAdmin;
                IsMember       = rol.IsMember && !rol.IsAdmin;
                NombreMostrado = rol.NombreMostrado;
            }
            else
            {
                CurrentUser    = null;
                IsAdmin        = false;
                IsMember       = false;
                NombreMostrado = null;
            }
        }
        else
        {
            CurrentUser    = null;
            IsAdmin        = false;
            IsMember       = false;
            NombreMostrado = null;
        }

        AuthStateChanged?.Invoke(CurrentUser);
    }
}

public class UserInfo
{
    public string Uid { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PhotoURL { get; set; } = string.Empty;
}

public class AuthResult
{
    public bool Success { get; set; }
    public UserInfo? User { get; set; }
    public string? Error { get; set; }
}

internal class AuthResultJs
{
    public bool Success { get; set; }
    public UserInfo? User { get; set; }
    public string? Error { get; set; }
}

public class RolData
{
    public bool IsAdmin { get; set; }
    public bool IsMember { get; set; }
    public string? NombreMostrado { get; set; }
}
