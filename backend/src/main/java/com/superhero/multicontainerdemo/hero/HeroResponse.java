package com.superhero.multicontainerdemo.hero;

public record HeroResponse(
        String username,
        String superHeroName,
        String heroCode
) {
    public static HeroResponse from(HeroProfile heroProfile) {
        return new HeroResponse(
                heroProfile.getUsername(),
                heroProfile.getSuperHeroName(),
                heroProfile.getHeroCode()
        );
    }
}
