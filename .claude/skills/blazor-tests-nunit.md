---
description: Use when the user wants to generate tests for a Blazor WebAssembly project — unit tests for business logic (models, services) or integration tests for external HTTP APIs (Firebase Cloud Functions, REST endpoints). Also use when setting up a new test project with NUnit for .NET, or when asked to add test coverage to a specific service or model class.
---

# Blazor Testing with NUnit (Unit + Integration)

## Test Project Setup

Add a new project `MyProject.IntegrationTests` to the solution:

```xml
<!-- MyProject.IntegrationTests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.14.0" />
    <PackageReference Include="NUnit" Version="4.3.2" />
    <PackageReference Include="NUnit3TestAdapter" Version="5.0.0" />
    <PackageReference Include="NUnit.Analyzers" Version="4.7.0" />
    <PackageReference Include="coverlet.collector" Version="6.0.4">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>
  <ItemGroup>
    <!-- Reference main project for unit tests of models/services -->
    <ProjectReference Include="..\MyProject\MyProject.csproj" />
  </ItemGroup>
</Project>
```

## _Imports.cs (global usings for the test project)

```csharp
global using NUnit.Framework;
global using System.Net;
global using System.Net.Http;
global using System.Net.Http.Json;
```

## Integration Test Pattern — External HTTP APIs

Use for: Firebase Cloud Functions, REST endpoints, any real HTTP call.

```csharp
[TestFixture]
[Category("Integration")]
public class MyServiceIntegrationTests
{
    private HttpClient _http = null!;

    // Real endpoint URLs — no mocking
    private const string MyFunctionUrl = "https://myfunction-XXXX-uc.a.run.app";

    [SetUp]
    public void SetUp()
    {
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
    }

    [TearDown]
    public void TearDown()
    {
        _http.Dispose();
    }

    /// <summary>
    /// Wrapper that converts 403 → Inconclusive instead of crashing.
    /// Other HTTP errors propagate as normal failures.
    /// </summary>
    private async Task<T?> GetJsonSafeAsync<T>(string url, string endpointName)
    {
        using var response = await _http.GetAsync(url);

        if (response.StatusCode == HttpStatusCode.Forbidden)
        {
            Assert.Inconclusive(
                $"Endpoint '{endpointName}' returned 403 Forbidden. " +
                $"Check IAM permissions or deploy the function with public invoker.");
        }

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>();
    }

    [Test]
    [Description("Function must return status OK and at least one result for a known query.")]
    public async Task GetItems_WithValidInput_ReturnsResults()
    {
        var url = $"{MyFunctionUrl}?input={Uri.EscapeDataString("test query")}";

        var response = await GetJsonSafeAsync<MyApiResponse>(url, "myFunction");

        Assert.That(response, Is.Not.Null, "Function returned null — check JSON shape.");
        Assert.That(response!.Status, Is.EqualTo("OK"),
            $"Expected status OK but got '{response.Status}'.");
        Assert.That(response.Items, Is.Not.Empty, "No items returned.");
    }

    [Test]
    [Description("Function must handle empty input gracefully.")]
    public async Task GetItems_WithEmptyInput_ReturnsEmptyOrError()
    {
        // Prerequisite: endpoint must be reachable
        using var probe = await _http.GetAsync(MyFunctionUrl);
        Assume.That(probe.StatusCode, Is.Not.EqualTo(HttpStatusCode.Forbidden),
            "Endpoint not accessible — skipping test.");

        var url = $"{MyFunctionUrl}?input=";
        using var response = await _http.GetAsync(url);

        // Accept either empty results or a 400 — both are valid behaviors
        Assert.That(
            (int)response.StatusCode,
            Is.AnyOf(200, 400),
            "Unexpected status code for empty input.");
    }
}
```

## Unit Test Pattern — Business Logic (Models/Services)

Use for: computed properties, weighted averages, validation, pure C# logic. No HTTP, no JSInterop.

```csharp
[TestFixture]
public class MyModelTests
{
    [Test]
    public void CalculateAverage_WithValidScores_ReturnsCorrectResult()
    {
        var model = new MyModel
        {
            Score1 = 4,
            Score2 = 3,
            Score3 = 5
        };

        var average = model.CalculateAverage();

        Assert.That(average, Is.EqualTo(4.0).Within(0.01));
    }

    [Test]
    public void IsValid_WhenWeightsDoNotSumTo100_ReturnsFalse()
    {
        var criteria = new Criteria { Weight1 = 50, Weight2 = 30 }; // 80, not 100

        Assert.That(criteria.IsValid(), Is.False);
    }

    [TestCase(1, 5, 3.0)]
    [TestCase(5, 5, 5.0)]
    [TestCase(1, 1, 1.0)]
    public void CalculateAverage_MultipleInputs_ReturnsExpected(int a, int b, double expected)
    {
        var model = new MyModel { Score1 = a, Score2 = b };
        Assert.That(model.CalculateAverage(), Is.EqualTo(expected).Within(0.01));
    }

    [Test]
    public void GroupedModel_WithTwoReviewers_CalculatesGroupAverage()
    {
        var grouped = new GroupedModel
        {
            ReviewerA = new MyModel { Score1 = 4, Score2 = 3 },
            ReviewerB = new MyModel { Score1 = 2, Score2 = 5 }
        };

        grouped.CalculateAverages();

        Assert.That(grouped.GroupAverage, Is.EqualTo(3.5).Within(0.01));
    }
}
```

## Key NUnit Attributes

| Attribute | Use |
|---|---|
| `[TestFixture]` | Test class |
| `[Test]` | Single test method |
| `[SetUp]` | Run before each test (create HttpClient, etc.) |
| `[TearDown]` | Run after each test (dispose resources) |
| `[Description("...")]` | Document what the test verifies |
| `[Category("Integration")]` | Tag for filtering: `dotnet test --filter Category=Integration` |
| `[TestCase(a, b, expected)]` | Data-driven tests (multiple inputs) |
| `Assert.Inconclusive(msg)` | Mark test as skipped/inconclusive (external dependency unavailable) |
| `Assume.That(condition)` | Skip test if prerequisite fails (vs. failing it) |

## Running Tests

```powershell
# Run all tests
dotnet test

# Run only integration tests
dotnet test --filter "Category=Integration"

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Reference files in patatas-con-palillos
- `ParquesolSoftware.PatatasConPalillos.IntegrationTests/MapsServiceIntegrationTests.cs`
- `ParquesolSoftware.PatatasConPalillos.IntegrationTests/ParquesolSoftware.PatatasConPalillos.IntegrationTests.csproj`
- `ParquesolSoftware.PatatasConPalillos/Models/Criterios.cs` (EsValido() — unit testable)
- `ParquesolSoftware.PatatasConPalillos/Models/Valoracion.cs` (CalcularMediaPonderada — unit testable)
- `ParquesolSoftware.PatatasConPalillos/Models/SitioAgrupado.cs` (CalcularMedias — unit testable)
