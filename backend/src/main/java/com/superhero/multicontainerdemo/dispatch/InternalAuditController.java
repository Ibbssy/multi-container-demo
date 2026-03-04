package com.superhero.multicontainerdemo.dispatch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class InternalAuditController {

    private static final Logger logger = LoggerFactory.getLogger(InternalAuditController.class);

    @GetMapping("/internal/audit-ack")
    public Map<String, String> acknowledge(@RequestParam String dispatchId) {
        logger.info("Audit acknowledgement request received");
        return Map.of("dispatchId", dispatchId, "status", "ACKNOWLEDGED");
    }
}