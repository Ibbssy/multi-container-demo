package com.superhero.multicontainerdemo;

import com.superhero.multicontainerdemo.hero.HeroLookupResponse;
import com.superhero.multicontainerdemo.hero.HeroService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SuperHeroController {

    private static final Logger logger = LoggerFactory.getLogger(SuperHeroController.class);

    private final HeroService heroService;

    public SuperHeroController(HeroService heroService) {
        this.heroService = heroService;
    }

    @GetMapping("/superhero")
    public HeroLookupResponse getSuperHero(@RequestParam String username) {
        logger.atInfo()
                .addKeyValue("username", username)
                .log("Received superhero lookup request");
        HeroLookupResponse hero = heroService.findHeroLookup(username);
        logger.atInfo()
                .addKeyValue("username", username)
                .addKeyValue("superHeroName", hero.superHeroName())
                .addKeyValue("heroCode", hero.heroCode())
                .log("Assigned superhero for request");
        return hero;
    }
}
