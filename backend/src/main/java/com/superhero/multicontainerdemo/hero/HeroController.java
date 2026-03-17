package com.superhero.multicontainerdemo.hero;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
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
    public List<HeroResponse> getHeroes(@RequestParam(required = false) String search) {
        return heroService.findAllHeroes(search);
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

    @PutMapping("/{username}")
    public HeroResponse updateHero(@PathVariable String username, @Valid @RequestBody CreateHeroRequest request) {
        logger.atInfo()
                .addKeyValue("username", username)
                .addKeyValue("updatedUsername", request.username())
                .log("Update hero request received");
        return heroService.updateHero(username, request);
    }

    @DeleteMapping("/{username}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHero(@PathVariable String username) {
        logger.atInfo()
                .addKeyValue("username", username)
                .log("Delete hero request received");
        heroService.deleteHero(username);
    }
}
