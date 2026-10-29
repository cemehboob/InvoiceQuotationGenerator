FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and csproj files for layer caching
COPY Invoxa.sln ./
COPY src/Invoxa.Domain/Invoxa.Domain.csproj src/Invoxa.Domain/
COPY src/Invoxa.Application/Invoxa.Application.csproj src/Invoxa.Application/
COPY src/Invoxa.Infrastructure/Invoxa.Infrastructure.csproj src/Invoxa.Infrastructure/
COPY src/Invoxa.API/Invoxa.API.csproj src/Invoxa.API/

RUN dotnet restore

# Copy full source and publish
COPY src/ src/
RUN dotnet publish src/Invoxa.API/Invoxa.API.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /out ./
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Invoxa.API.dll"]
