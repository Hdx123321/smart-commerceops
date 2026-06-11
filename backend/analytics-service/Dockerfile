FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl analytics-service -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/analytics-service/target/analytics-service-1.0.0.jar app.jar
EXPOSE 8095
ENTRYPOINT ["java", "-jar", "app.jar"]
