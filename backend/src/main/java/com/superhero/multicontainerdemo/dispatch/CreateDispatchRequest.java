package com.superhero.multicontainerdemo.dispatch;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateDispatchRequest(
        @NotBlank String productCode,
        @Min(1) int quantity
) {
}