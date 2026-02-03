FROM cegbuacx-docker-virtual.dockerhub-phx.oci.oraclecorp.com/search/java17-base-image:latest
WORKDIR /app
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]