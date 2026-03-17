package com.superhero.multicontainerdemo.hero;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "hero_profiles")
public class HeroProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "super_hero_name", nullable = false)
    private String superHeroName;

    @Column(name = "hero_code")
    private String heroCode;

    protected HeroProfile() {
    }

    public HeroProfile(String username, String superHeroName, String heroCode) {
        this.username = normalizeUsername(username);
        this.superHeroName = superHeroName.trim();
        this.heroCode = normalizeHeroCode(heroCode);
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getSuperHeroName() {
        return superHeroName;
    }

    public String getHeroCode() {
        return heroCode;
    }

    public void updateProfile(String username, String superHeroName, String heroCode) {
        this.username = normalizeUsername(username);
        this.superHeroName = superHeroName.trim();
        this.heroCode = normalizeHeroCode(heroCode);
    }

    private static String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }

    private static String normalizeHeroCode(String heroCode) {
        return heroCode == null ? "" : heroCode.trim().toUpperCase();
    }
}
