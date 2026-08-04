# Multi-stage build: compile with the full JDK, run on a slim JRE so the
# final image doesn't ship a compiler it never needs at runtime.

FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy only what's needed to resolve dependencies first, so the dependency
# layer stays cached across rebuilds that only touch application source.
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon > /dev/null 2>&1 || true

COPY src src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S baaki && adduser -S baaki -G baaki
COPY --from=build /app/build/libs/*.jar app.jar
USER baaki

# Railway (and most PaaS) inject $PORT at runtime - application.yml already
# falls back to it via server.port: ${SERVER_PORT:${PORT:8080}}.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
