using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Invoxa.API.Middleware;
using Invoxa.Infrastructure;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// 1. Core Services, Infrastructure & Health Checks
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();
builder.Services.AddInfrastructureServices(builder.Configuration);

// Configure Forwarded Headers for reverse proxies (Nginx, Traefik, AWS ALB, Cloudflare, Azure App Service)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// 2. JWT Authentication Configuration
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "InvoxaEnterpriseSuperSecretKey2026SecureJwtTokenGenerator!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "InvoxaAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "InvoxaClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

// 3. CORS Policy for Web & Mobile Platforms (Web browsers, iOS Capacitor, Android Capacitor)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;

            // 1. Allow Mobile Hybrid Schemes (Capacitor for iOS & Android)
            if (origin.StartsWith("capacitor://", StringComparison.OrdinalIgnoreCase) ||
                origin.StartsWith("ionic://", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // 2. Allow Localhost / Dev / Android Emulator (10.0.2.2)
            if (origin.Contains("localhost") || origin.Contains("127.0.0.1") || origin.Contains("10.0.2.2"))
            {
                return true;
            }

            // 3. Allow Explicitly Configured Production Origins
            if (allowedOrigins.Any(o => origin.Equals(o, StringComparison.OrdinalIgnoreCase) ||
                                       (o.StartsWith("*.") && origin.EndsWith(o[1..], StringComparison.OrdinalIgnoreCase))))
            {
                return true;
            }

            // 4. Default SaaS Cloud Domains
            if (origin.EndsWith(".invoxa.com", StringComparison.OrdinalIgnoreCase) ||
                origin.EndsWith(".azurewebsites.net", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// 4. Swagger with JWT Support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Invoxa - Invoice & Quotation Management API",
        Version = "v1",
        Description = "Multi-tenant REST API for invoice and quotation management across Web, Android, and iOS."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 5. Middleware Pipeline
app.UseForwardedHeaders();
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// Health check endpoint for Docker / K8s / Load Balancers
app.MapHealthChecks("/health");
app.MapHealthChecks("/api/health");

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("EnableSwaggerInProd", false))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Invoxa API v1");
    });
}

// Only enforce HTTPS redirection if running outside container reverse-proxy setup
if (!app.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("UseHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();
