---
description: Use when the user wants to integrate Firebase into a Blazor WebAssembly project. Covers Firebase Auth (Google Sign-In), Firestore CRUD, Firebase Storage (file upload), Cloud Functions as API proxies, and the JSInterop bridge pattern. Also use when asked to set up Firebase free tier (Spark plan) for a Blazor app, configure firestore.rules/storage.rules, or load firebase-config.json at runtime.
---

# Firebase + Blazor WebAssembly Integration (JSInterop Pattern)

## Architecture

Blazor WASM cannot use Firebase Admin SDK (server-only). Instead:
1. Firebase JS SDK (compat) is loaded in `index.html`
2. `firebase-interop.js` wraps all Firebase calls in `window.firebaseInterop`
3. C# services call JS via `IJSRuntime.InvokeAsync<T>`
4. Config is loaded at runtime from `wwwroot/firebase-config.json` (not in git)

## firebase-interop.js — Module Structure

```javascript
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStorage = null;

window.firebaseInterop = {
    async initialize(config) {
        try {
            if (!firebaseApp) {
                firebaseApp = firebase.initializeApp(config);
                firebaseAuth = firebase.auth();
                firebaseDb = firebase.firestore();
                firebaseStorage = firebase.storage();
            }
            return true;
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            return false;
        }
    },

    // === AUTH ===
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebaseAuth.signInWithPopup(provider);
            return {
                success: true,
                user: {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async signOut() {
        try {
            await firebaseAuth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getCurrentUser() {
        const user = firebaseAuth.currentUser;
        if (!user) return null;
        return { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
    },

    // Called with DotNetObjectReference — invokes C# [JSInvokable] method
    onAuthStateChanged(dotNetHelper) {
        return firebaseAuth.onAuthStateChanged((user) => {
            dotNetHelper.invokeMethodAsync('OnAuthStateChanged', user
                ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL }
                : null);
        });
    },

    // === FIRESTORE CRUD ===
    // Pattern: always return { success, data?, id?, error? }
    // Convert Timestamps to ISO strings so C# can deserialize them
    async getItems() {
        try {
            const snapshot = await firebaseDb.collection('items').get();
            const items = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                items.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof firebase.firestore.Timestamp
                        ? data.createdAt.toDate().toISOString() : data.createdAt
                });
            });
            return { success: true, data: items };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async createItem(itemData) {
        try {
            const docRef = await firebaseDb.collection('items').add({
                ...itemData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateItem(id, itemData) {
        try {
            await firebaseDb.collection('items').doc(id).update({
                ...itemData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteItem(id) {
        try {
            await firebaseDb.collection('items').doc(id).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // === STORAGE ===
    async uploadFile(path, bytes, contentType) {
        try {
            const ref = firebaseStorage.ref(path);
            const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
            const snapshot = await ref.put(blob);
            const downloadURL = await snapshot.ref.getDownloadURL();
            return { success: true, url: downloadURL };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteFile(path) {
        try {
            await firebaseStorage.ref(path).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};
```

## FirestoreService.cs — C# Side

```csharp
public class FirestoreService
{
    private readonly IJSRuntime _jsRuntime;
    private readonly HttpClient _httpClient;
    private bool _isInitialized = false;

    public FirestoreService(IJSRuntime jsRuntime, HttpClient httpClient)
    {
        _jsRuntime = jsRuntime;
        _httpClient = httpClient;
    }

    public async Task<bool> InitializeAsync()
    {
        if (_isInitialized) return true;
        try
        {
            var config = await _httpClient.GetFromJsonAsync<FirebaseConfig>("/firebase-config.json");
            if (config == null) return false;

            var firebaseConfig = new
            {
                apiKey = config.ApiKey,
                authDomain = config.AuthDomain,
                projectId = config.ProjectId,
                storageBucket = config.StorageBucket,
                messagingSenderId = config.MessagingSenderId,
                appId = config.AppId
            };

            _isInitialized = await _jsRuntime.InvokeAsync<bool>("firebaseInterop.initialize", firebaseConfig);
            return _isInitialized;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error initializing Firebase: {ex.Message}");
            return false;
        }
    }

    private async Task EnsureInitializedAsync()
    {
        if (!_isInitialized) await InitializeAsync();
    }

    public async Task<List<MyModel>> GetItemsAsync()
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<MyModel>>>("firebaseInterop.getItems");
        return result.Success && result.Data != null ? result.Data : new List<MyModel>();
    }

    public async Task<string?> CreateItemAsync(MyModel item)
    {
        await EnsureInitializedAsync();
        var data = new { name = item.Name, /* map all properties */ };
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<string>>("firebaseInterop.createItem", data);
        return result.Success ? result.Id : null;
    }
}

// Generic result wrapper — mirrors JS { success, data?, id?, error? }
public class FirestoreResult<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Id { get; set; }
    public string? Error { get; set; }
}

public class FirebaseConfig
{
    [JsonPropertyName("apiKey")] public string ApiKey { get; set; } = string.Empty;
    [JsonPropertyName("authDomain")] public string AuthDomain { get; set; } = string.Empty;
    [JsonPropertyName("projectId")] public string ProjectId { get; set; } = string.Empty;
    [JsonPropertyName("storageBucket")] public string StorageBucket { get; set; } = string.Empty;
    [JsonPropertyName("messagingSenderId")] public string MessagingSenderId { get; set; } = string.Empty;
    [JsonPropertyName("appId")] public string AppId { get; set; } = string.Empty;
}
```

## AuthService.cs — Google Auth + Whitelist Pattern

```csharp
public class AuthService
{
    private readonly IJSRuntime _jsRuntime;
    private readonly FirestoreService _firestoreService;
    private readonly List<string> _authorizedEmails = new() { "admin@example.com" };

    public UserInfo? CurrentUser { get; private set; }
    public bool IsAuthorized => CurrentUser != null && _authorizedEmails.Contains(CurrentUser.Email);
    public event Action<UserInfo?>? AuthStateChanged;

    public async Task<AuthResult> SignInWithGoogleAsync()
    {
        await _firestoreService.InitializeAsync();
        var result = await _jsRuntime.InvokeAsync<AuthResultJs>("firebaseInterop.signInWithGoogle");

        if (result.Success && result.User != null)
        {
            if (!_authorizedEmails.Contains(result.User.Email))
            {
                await SignOutAsync();
                return new AuthResult { Success = false, Error = "Usuario no autorizado." };
            }
            CurrentUser = result.User;
            AuthStateChanged?.Invoke(CurrentUser);
            return new AuthResult { Success = true, User = CurrentUser };
        }
        return new AuthResult { Success = false, Error = result.Error };
    }

    public async Task InitializeAuthStateListenerAsync()
    {
        await _firestoreService.InitializeAsync();
        var dotNetRef = DotNetObjectReference.Create(this);
        await _jsRuntime.InvokeVoidAsync("firebaseInterop.onAuthStateChanged", dotNetRef);
    }

    [JSInvokable("OnAuthStateChanged")]
    public void OnAuthStateChanged(UserInfo? user)
    {
        CurrentUser = user != null && _authorizedEmails.Contains(user.Email) ? user : null;
        AuthStateChanged?.Invoke(CurrentUser);
    }
}
```

## StorageService.cs

```csharp
public class StorageService
{
    private readonly IJSRuntime _jsRuntime;

    public async Task<string?> UploadFileAsync(string path, byte[] bytes, string contentType)
    {
        var result = await _jsRuntime.InvokeAsync<UploadResult>("firebaseInterop.uploadFile", path, bytes, contentType);
        return result.Success ? result.Url : null;
    }

    public async Task<bool> DeleteFileAsync(string path)
    {
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.deleteFile", path);
        return result.Success;
    }
}

internal class UploadResult { public bool Success { get; set; } public string? Url { get; set; } }
```

## Cloud Functions — API Key Proxy Pattern

Use Cloud Functions to hide API keys (Maps, external APIs). The Blazor app calls the Function URL, never the API directly.

```javascript
// functions/index.js
const functions = require('firebase-functions');
const axios = require('axios');

exports.myApiProxy = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const apiKey = functions.config().myservice.apikey;
    const response = await axios.get(`https://api.example.com/endpoint`, {
        params: { ...req.query, key: apiKey }
    });
    res.json(response.data);
});
```

```csharp
// C# service calling the Cloud Function
public class MyApiService
{
    private readonly HttpClient _http;
    private const string FunctionUrl = "https://myapiproxy-XXXX-uc.a.run.app";

    public async Task<MyResponse?> CallApiAsync(string input)
    {
        var url = $"{FunctionUrl}?input={Uri.EscapeDataString(input)}";
        return await _http.GetFromJsonAsync<MyResponse>(url);
    }
}
```

## firebase-config.json (in wwwroot, excluded from git)

```json
{
  "apiKey": "AIza...",
  "authDomain": "my-project.firebaseapp.com",
  "projectId": "my-project",
  "storageBucket": "my-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123"
}
```

Add to `.gitignore`:
```
**/wwwroot/firebase-config.json
```

## firestore.rules (free tier — public read, authenticated write)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## storage.rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Reference files in patatas-con-palillos
- `ParquesolSoftware.PatatasConPalillos/Services/FirestoreService.cs`
- `ParquesolSoftware.PatatasConPalillos/Services/AuthService.cs`
- `ParquesolSoftware.PatatasConPalillos/Services/StorageService.cs`
- `ParquesolSoftware.PatatasConPalillos/Services/MapsService.cs`
- `ParquesolSoftware.PatatasConPalillos/wwwroot/js/firebase-interop.js`
- `ParquesolSoftware.PatatasConPalillos/firebase.json`
