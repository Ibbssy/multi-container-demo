package com.superhero.multicontainerdemo.hero;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/heroes")
public class HeroController {

    private static final Logger logger = LoggerFactory.getLogger(HeroController.class);

    private final HeroService heroService;

    public HeroController(HeroService heroService) {
        this.heroService = heroService;
    }

    @GetMapping
    public List<HeroResponse> getHeroes() {
        return heroService.findAllHeroes();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HeroResponse createHero(@Valid @RequestBody CreateHeroRequest request) {
        logger.atInfo()
                .addKeyValue("username", request.username())
                .addKeyValue("superHeroName", request.superHeroName())
                .log("Create hero request received");
        return heroService.createHero(request);
    }
}
