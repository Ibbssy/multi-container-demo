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