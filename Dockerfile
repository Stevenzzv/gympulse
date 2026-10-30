# One image with the React app and the Spring Boot API: open https://your-domain/ and it all works.

# 1) Build the React frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Same origin as the API, so VITE_API_URL stays empty
RUN npm run build

# 2) Build the Spring Boot jar with the React build inside as static files
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn -q dependency:go-offline -DskipTests
COPY backend/src ./src
COPY --from=frontend /app/dist ./src/main/resources/static
RUN mvn -q package -DskipTests

# 3) Small runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend /app/target/gymsaas-backend-*.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
