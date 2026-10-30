FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Flags de JVM para subir mais rápido e usar menos memória em servidores pequenos (plano gratuito):
# - TieredStopAtLevel=1: compila só com o compilador rápido (C1), acelerando o start
# - SerialGC: coletor de lixo mais leve para 1 CPU
# - MaxRAMPercentage: usa até 75% da memória do container para o heap
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-XX:MaxRAMPercentage=75", "-Dspring.profiles.active=h2", "-Dserver.port=8080", "-jar", "app.jar"]
