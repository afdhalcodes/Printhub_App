package com.project.printhubback.repository;

import com.project.printhubback.model.authentication.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User,Long> {

    Optional<User> findByEmailOrUsername(String email,String username);

    Optional<User> findByEmailIgnoreCaseOrUsernameIgnoreCase(String email,String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}
