package com.superhero.multicontainerdemo.hero;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class HeroService {

    private static final String DEFAULT_SUPER_HERO_NAME = "User";
    private static final String DEFAULT_HERO_CODE = "";

    private final HeroProfileRepository heroProfileRepository;

    public HeroService(HeroProfileRepository heroProfileRepository) {
        this.heroProfileRepository = heroProfileRepository;
    }

    @Transactional(readOnly = true)
    public String findSuperHeroName(String username) {
        return findHeroByUsername(username)
                .map(HeroProfile::getSuperHeroName)
                .orElse(DEFAULT_SUPER_HERO_NAME);
    }

    @Transactional(readOnly = true)
    public HeroLookupResponse findHeroLookup(String username) {
        if (username == null || username.isBlank()) {
            return new HeroLookupResponse(DEFAULT_SUPER_HERO_NAME, DEFAULT_HERO_CODE);
        }

        return findHeroByUsername(username)
                .map(heroProfile -> new HeroLookupResponse(
                        heroProfile.getSuperHeroName(),
                        heroProfile.getHeroCode()
                ))
                .orElse(new HeroLookupResponse(DEFAULT_SUPER_HERO_NAME, DEFAULT_HERO_CODE));
    }

    @Transactional(readOnly = true)
    public List<HeroResponse> findAllHeroes() {
        return heroProfileRepository.findAllByOrderByUsernameAsc().stream()
                .map(HeroResponse::from)
                .toList();
    }

    @Transactional
    public HeroResponse createHero(CreateHeroRequest request) {
        String normalizedUsername = request.username().trim().toLowerCase();

        if (heroProfileRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Hero already exists for username: " + normalizedUsername
            );
        }

        HeroProfile savedProfile = heroProfileRepository.save(
                new HeroProfile(normalizedUsername, request.superHeroName(), request.heroCode())
        );
        return HeroResponse.from(savedProfile);
    }

    @Transactional
    public void upsertHero(String username, String superHeroName, String heroCode) {
        Optional<HeroProfile> existingProfile = heroProfileRepository.findByUsernameIgnoreCase(username);
        if (existingProfile.isPresent()) {
            HeroProfile heroProfile = existingProfile.get();
            heroProfile.updateHeroDetails(superHeroName, heroCode);
            heroProfileRepository.save(heroProfile);
            return;
        }

        heroProfileRepository.save(new HeroProfile(username, superHeroName, heroCode));
    }

    private Optional<HeroProfile> findHeroByUsername(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        return heroProfileRepository.findByUsernameIgnoreCase(username.trim());
    }
}
