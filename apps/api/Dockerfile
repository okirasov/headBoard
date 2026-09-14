# Build context: apps/api (see fly.toml). Two stages: SDK to publish, ASP.NET runtime to run.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Headboard.Api/Headboard.Api.csproj Headboard.Api/
RUN dotnet restore Headboard.Api/Headboard.Api.csproj
COPY Headboard.Api/ Headboard.Api/
RUN dotnet publish Headboard.Api/Headboard.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# SQLite database and uploaded files live on the mounted volume (/data), see fly.toml [env].
RUN mkdir -p /data
ENV ASPNETCORE_HTTP_PORTS=8080 ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "Headboard.Api.dll"]
