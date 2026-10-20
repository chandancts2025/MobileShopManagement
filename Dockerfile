# Stage 1: Build & Publish with .NET 9 SDK
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files for layer caching
COPY ["MobileShop.Domain/MobileShop.Domain.csproj", "MobileShop.Domain/"]
COPY ["MobileShop.Application/MobileShop.Application.csproj", "MobileShop.Application/"]
COPY ["MobileShop.Infrastructure/MobileShop.Infrastructure.csproj", "MobileShop.Infrastructure/"]
COPY ["MobileShop.Api/MobileShop.Api.csproj", "MobileShop.Api/"]

# Restore NuGet dependencies
RUN dotnet restore "MobileShop.Api/MobileShop.Api.csproj"

# Copy remaining source code
COPY . .

# Build and publish in Release mode
WORKDIR "/src/MobileShop.Api"
RUN dotnet publish "MobileShop.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: ASP.NET Core 9 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Expose default container ports for Render
EXPOSE 8080
EXPOSE 10000

ENV ASPNETCORE_URLS=http://0.0.0.0:8080;http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MobileShop.Api.dll"]
