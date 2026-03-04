package com.superhero.multicontainerdemo.dispatch;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/dispatches")
public class DispatchController {

    private static final Logger logger = LoggerFactory.getLogger(DispatchController.class);

    private final DispatchService dispatchService;

    public DispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createDispatch(@Valid @RequestBody CreateDispatchRequest request) {
        logger.atInfo()
                .addKeyValue("heroCode", request.productCode())
                .addKeyValue("quantity", request.quantity())
                .log("Create dispatch request received");
        return dispatchService.createDispatch(request);
    }
}