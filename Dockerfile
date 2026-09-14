# One image for Fly.io: the API plus the built web app served from its wwwroot (same origin, no CORS).
# Build context: repository root (fly.toml lives here).

# ---- web (Vite) ----
FROM node:22-bookworm-slim AS web
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci --workspace=@headboard/core --workspace=@headboard/web --include-workspace-root
COPY packages/core packages/core
COPY apps/web apps/web
# Same-origin API: "/" makes the client call relative paths on the host that served the page.
ARG VITE_API_URL=/
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_APPLE_SERVICES_ID=
ARG VITE_APPLE_REDIRECT_URI=
ENV VITE_API_URL=$VITE_API_URL VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID VITE_APPLE_SERVICES_ID=$VITE_APPLE_SERVICES_ID VITE_APPLE_REDIRECT_URI=$VITE_APPLE_REDIRECT_URI
RUN npm run build -w @headboard/web

# ---- api (.NET) ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src
COPY apps/api/Headboard.Api/Headboard.Api.csproj Headboard.Api/
RUN dotnet restore Headboard.Api/Headboard.Api.csproj
COPY apps/api/Headboard.Api/ Headboard.Api/
RUN dotnet publish Headboard.Api/Headboard.Api.csproj -c Release -o /app --no-restore

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=api /app .
COPY --from=web /repo/apps/web/dist ./wwwroot
RUN mkdir -p /data
ENV ASPNETCORE_HTTP_PORTS=8080 ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "Headboard.Api.dll"]
