package com.superhero.multicontainerdemo.hero;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HeroProfileRepository extends JpaRepository<HeroProfile, Long> {

    Optional<HeroProfile> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    List<HeroProfile> findAllByOrderByUsernameAsc();
}
