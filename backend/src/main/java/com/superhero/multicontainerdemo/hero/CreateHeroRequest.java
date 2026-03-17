package com.superhero.multicontainerdemo.hero;

import jakarta.validation.constraints.NotBlank;

public record CreateHeroRequest(
        @NotBlank String username,
        @NotBlank String superHeroName,
        @NotBlank String heroCode
) {
}
