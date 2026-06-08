using FluentAssertions;
using Microsoft.JSInterop;
using Moq;
using ParquesolSoftware.MesetaInclinada.Models;
using ParquesolSoftware.MesetaInclinada.Services;

namespace ParquesolSoftware.MesetaInclinada.Tests.Services;

public class AuthServiceTests
{
    private (AuthService auth, Mock<IJSRuntime> js, FirestoreService firestore) Build()
    {
        var js = new Mock<IJSRuntime>();
        var handler = new FakeHttpMessageHandler("""
            {"apiKey":"k","authDomain":"x.com","projectId":"t","storageBucket":"t.app","messagingSenderId":"1","appId":"a"}
            """);
        var http = new System.Net.Http.HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        var firestore = new FirestoreService(js.Object, http);
        var auth = new AuthService(js.Object, firestore);
        return (auth, js, firestore);
    }

    /// <summary>
    /// Simula un getRolData exitoso de Firestore devolviendo un objeto anónimo compatible.
    /// </summary>
    private static void SetupRolData(Mock<IJSRuntime> js, bool admin, bool miembro = false)
    {
        js.Setup(x => x.InvokeAsync<FirestoreResult<RolDataJs>>(
                "firebaseInterop.getRolData", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<RolDataJs>
          {
              Success = true,
              Data    = new RolDataJs { Admin = admin, Miembro = miembro, NombreMostrado = admin ? "Admin" : "Miembro" }
          });
    }

    [Fact]
    public void Estado_inicial_CurrentUser_es_null_y_no_es_admin()
    {
        var (auth, _, _) = Build();
        auth.CurrentUser.Should().BeNull();
        auth.IsAdmin.Should().BeFalse();
    }

    [Fact]
    public async Task SignInWithGoogle_falla_si_usuario_no_es_admin_ni_miembro()
    {
        var (auth, js, _) = Build();

        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<AuthResultJs>("firebaseInterop.signInWithGoogle", It.IsAny<object[]>()))
          .ReturnsAsync(new AuthResultJs { Success = true, User = new UserInfo { Uid = "uid-no-auth", Email = "noauth@test.com" } });
        SetupRolData(js, admin: false, miembro: false);
        // Sin invitación
        js.Setup(x => x.InvokeAsync<FirestoreResult<Invitacion>>(
                "firebaseInterop.checkInvitacion", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<Invitacion> { Success = false });
        // Guardar solicitud (no importa el resultado)
        js.Setup(x => x.InvokeAsync<FirestoreResult<object>>(
                "firebaseInterop.saveSolicitud", It.IsAny<object[]>()))
          .ReturnsAsync(new FirestoreResult<object> { Success = true });
        // SignOut
        js.Setup(x => x.InvokeAsync<AuthResultJs>("firebaseInterop.signOut", It.IsAny<object[]>()))
          .ReturnsAsync(new AuthResultJs { Success = true });

        var result = await auth.SignInWithGoogleAsync();

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Sin permisos");
        auth.IsAdmin.Should().BeFalse();
        auth.CurrentUser.Should().BeNull();
    }

    [Fact]
    public async Task SignInWithGoogle_exito_si_usuario_es_admin()
    {
        var (auth, js, _) = Build();
        var user = new UserInfo { Uid = "uid-admin", Email = "admin@meseta.com", DisplayName = "Admin" };

        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>()))
          .ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<AuthResultJs>("firebaseInterop.signInWithGoogle", It.IsAny<object[]>()))
          .ReturnsAsync(new AuthResultJs { Success = true, User = user });
        SetupRolData(js, admin: true);

        var result = await auth.SignInWithGoogleAsync();

        result.Success.Should().BeTrue();
        auth.IsAdmin.Should().BeTrue();
        auth.CurrentUser.Should().NotBeNull();
        auth.CurrentUser!.DisplayName.Should().Be("Admin");
    }

    [Fact]
    public async Task SignOut_limpia_usuario_y_admin()
    {
        var (auth, js, _) = Build();
        var user = new UserInfo { Uid = "uid-admin", Email = "admin@test.com" };

        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>())).ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<AuthResultJs>("firebaseInterop.signInWithGoogle", It.IsAny<object[]>()))
          .ReturnsAsync(new AuthResultJs { Success = true, User = user });
        SetupRolData(js, admin: true);
        js.Setup(x => x.InvokeAsync<AuthResultJs>("firebaseInterop.signOut", It.IsAny<object[]>()))
          .ReturnsAsync(new AuthResultJs { Success = true });

        await auth.SignInWithGoogleAsync();
        auth.IsAdmin.Should().BeTrue();

        await auth.SignOutAsync();

        auth.IsAdmin.Should().BeFalse();
        auth.CurrentUser.Should().BeNull();
    }

    [Fact]
    public async Task SignInWithGoogle_dispara_AuthStateChanged_al_hacer_login()
    {
        var (auth, js, _) = Build();
        UserInfo? userRecibido = null;
        auth.AuthStateChanged += u => userRecibido = u;

        js.Setup(x => x.InvokeAsync<bool>("firebaseInterop.initialize", It.IsAny<object[]>())).ReturnsAsync(true);
        js.Setup(x => x.InvokeAsync<AuthResultJs>("firebaseInterop.signInWithGoogle", It.IsAny<object[]>()))
          .ReturnsAsync(new AuthResultJs { Success = true, User = new UserInfo { Uid = "u1", Email = "admin@test.com" } });
        SetupRolData(js, admin: true);

        await auth.SignInWithGoogleAsync();

        userRecibido.Should().NotBeNull();
    }
}
