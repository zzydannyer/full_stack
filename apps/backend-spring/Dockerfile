FROM eclipse-temurin:25-jdk AS builder

WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw --batch-mode dependency:go-offline
COPY src src
RUN ./mvnw --batch-mode package -DskipTests

FROM eclipse-temurin:25-jre

WORKDIR /app
COPY --from=builder /app/target/backend-spring-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 3003
ENTRYPOINT ["java", "-jar", "app.jar"]
