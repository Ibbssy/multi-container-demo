package com.superhero.multicontainerdemo;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
public class SuperHeroController {
    private static final Map<String, String> SUPER_HEROES = new HashMap<>();
    static {
        SUPER_HEROES.put("tony", "IronMan");
        SUPER_HEROES.put("diana", "WonderWoman");
        SUPER_HEROES.put("mark", "Invincible");
        SUPER_HEROES.put("peter", "Spider-Man");
        SUPER_HEROES.put("miles", "Spider-Man");
        SUPER_HEROES.put("bruce", "BatMan");
        SUPER_HEROES.put("clark", "SuperMan");
        SUPER_HEROES.put("robert", "Mecha Man");
        // add more as needed
    }

    @GetMapping("/superhero")
    public Map<String, String> getSuperHero(@RequestParam String username) {
        String hero = SUPER_HEROES.getOrDefault(username.toLowerCase(), "User");
        Map<String, String> response = new HashMap<>();
        response.put("superHeroName", hero);
        return response;
    }
}