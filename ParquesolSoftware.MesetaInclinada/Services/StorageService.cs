using Microsoft.JSInterop;

namespace ParquesolSoftware.MesetaInclinada.Services;

public class StorageService
{
    private readonly IJSRuntime _jsRuntime;
    private readonly FirestoreService _firestoreService;

    public StorageService(IJSRuntime jsRuntime, FirestoreService firestoreService)
    {
        _jsRuntime = jsRuntime;
        _firestoreService = firestoreService;
    }

    public async Task<bool> UploadGpxAsync(string filename, byte[] fileBytes)
    {
        await _firestoreService.InitializeAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>(
            "firebaseInterop.uploadGpx", filename, fileBytes, "application/gpx+xml");
        return result.Success;
    }

    public async Task<string?> GetGpxUrlAsync(string filename)
    {
        await _firestoreService.InitializeAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<string>>(
            "firebaseInterop.getGPXUrl", filename);
        return result.Success ? result.Data : null;
    }
}
