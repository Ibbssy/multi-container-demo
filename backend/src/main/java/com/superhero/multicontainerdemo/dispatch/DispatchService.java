package com.superhero.multicontainerdemo.dispatch;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@Service
public class DispatchService {

    private static final Logger logger = LoggerFactory.getLogger(DispatchService.class);

    private final Counter dispatchesCreatedCounter;
    private final Timer dispatchProcessingSuccessTimer;
    private final Timer dispatchProcessingErrorTimer;
    private final MeterRegistry meterRegistry;
    private final RestTemplate restTemplate;
    private final String auditBaseUrl;

    public DispatchService(
            MeterRegistry meterRegistry,
            RestTemplate restTemplate,
            @Value("${app.audit.base-url}") String auditBaseUrl
    ) {
        this.meterRegistry = meterRegistry;
        this.restTemplate = restTemplate;
        this.auditBaseUrl = auditBaseUrl;
        this.dispatchesCreatedCounter = Counter.builder("dispatches_created_total")
                .description("Total number of created dispatches")
                .tag("channel", "api")
                .register(meterRegistry);
        this.dispatchProcessingSuccessTimer = Timer.builder("dispatch_processing_seconds")
                .description("Dispatch processing duration in seconds")
                .tag("operation", "create_dispatch")
                .tag("status", "success")
                .register(meterRegistry);
        this.dispatchProcessingErrorTimer = Timer.builder("dispatch_processing_seconds")
                .description("Dispatch processing duration in seconds")
                .tag("operation", "create_dispatch")
                .tag("status", "error")
                .register(meterRegistry);
    }

    public Map<String, Object> createDispatch(CreateDispatchRequest request) {
        Timer.Sample sample = Timer.start(meterRegistry);
        String status = "success";
        try {
            String dispatchId = UUID.randomUUID().toString();
            dispatchesCreatedCounter.increment();
            sendAuditAcknowledgement(dispatchId);
            logger.atInfo()
                    .addKeyValue("dispatchId", dispatchId)
                    .addKeyValue("heroCode", request.heroCode())
                    .addKeyValue("quantity", request.quantity())
                    .log("Dispatch created");
            return Map.of(
                    "dispatchId", dispatchId,
                    "status", "CREATED",
                    "heroCode", request.heroCode(),
                    "quantity", request.quantity()
            );
        } catch (RuntimeException exception) {
            status = "error";
            throw exception;
        } finally {
            sample.stop("success".equals(status) ? dispatchProcessingSuccessTimer : dispatchProcessingErrorTimer);
        }
    }

    private void sendAuditAcknowledgement(String dispatchId) {
        URI auditUri = UriComponentsBuilder.fromHttpUrl(auditBaseUrl)
                .path("/internal/audit-ack")
                .queryParam("dispatchId", dispatchId)
                .build()
                .toUri();
        try {
            restTemplate.getForObject(auditUri, Map.class);
            logger.atInfo()
                    .addKeyValue("dispatchId", dispatchId)
                    .log("Audit acknowledgement sent");
        } catch (RestClientException exception) {
            logger.atWarn()
                    .setCause(exception)
                    .addKeyValue("dispatchId", dispatchId)
                    .log("Audit acknowledgement failed");
        }
    }
}