package com.superhero.multicontainerdemo.hero;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class HeroDataInitializer implements CommandLineRunner {

    private final HeroService heroService;

    public HeroDataInitializer(HeroService heroService) {
        this.heroService = heroService;
    }

    @Override
    public void run(String... args) {
        List.of(
                new SeedHero("tony", "IronMan", "SHELLHEAD"),
                new SeedHero("diana", "WonderWoman", "AMAZON"),
                new SeedHero("mark", "Invincible", "INVINCIBLE"),
                new SeedHero("sonic", "SONIC", "BLUE-BLUR"),
                new SeedHero("peter", "Spider-Man", "WEB-HEAD"),
                new SeedHero("miles", "Spider-Man", "WEB-HEAD"),
                new SeedHero("bruce", "BatMan", "DARK-KNIGHT"),
                new SeedHero("clark", "SuperMan", "LAST-SON"),
                new SeedHero("robert", "Mecha Man", "MECHA-BLUE"),
                new SeedHero("steve", "Captain America", "STAR-SPANGLED")
        ).forEach(hero -> heroService.upsertHero(hero.username(), hero.superHeroName(), hero.heroCode()));
    }

    private record SeedHero(String username, String superHeroName, String heroCode) {
    }
}
