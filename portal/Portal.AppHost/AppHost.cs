var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.Portal_Api>("portal-api")
    .WithHttpHealthCheck("/health");

builder.AddProject<Projects.Portal_Web>("portal-web")
    .WithExternalHttpEndpoints()
    .WithHttpHealthCheck("/health")
    .WithReference(api)
    .WaitFor(api);

builder.Build().Run();
