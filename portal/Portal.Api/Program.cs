using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();

// Add services to the container.
builder.Services.AddProblemDetails();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/", () => "Dialled In Portal API is running. See /api/status.");

app.MapGet("/api/status", () => new PortalStatus(
    "Dialled In Portal API",
    Assembly.GetExecutingAssembly().GetName().Version?.ToString(3) ?? "0.0.0",
    DateTimeOffset.UtcNow))
    .WithName("GetStatus");

app.MapDefaultEndpoints();

app.Run();

record PortalStatus(string Service, string Version, DateTimeOffset Timestamp);
