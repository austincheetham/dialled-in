var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.DialledIn_Portal_ApiService>("portal-api")
    .WithHttpHealthCheck("/health");

builder.AddProject<Projects.DialledIn_Portal_Web>("portal-web")
    .WithExternalHttpEndpoints()
    .WithHttpHealthCheck("/health")
    .WithReference(api)
    .WaitFor(api);

builder.Build().Run();
