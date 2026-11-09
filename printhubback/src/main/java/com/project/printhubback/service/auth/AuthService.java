
package com.project.printhubback.service.auth;

import com.project.printhubback.dto.LoginRequest;
import com.project.printhubback.dto.RegisterRequest;
import com.project.printhubback.model.authentication.User;
import com.project.printhubback.repository.UserRepo;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepo userRepo,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager
    ) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    // REGISTER
    public User register(RegisterRequest request) {

        // Check duplicate email or username
        boolean userExists = userRepo
                .findByEmailIgnoreCaseOrUsernameIgnoreCase(
                        request.getEmail(),
                        request.getUsername()
                )
                .isPresent();

        if (userExists) {
            throw new IllegalArgumentException(
                    "Email or username already exists"
            );
        }

        User user = new User();

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        // Hash the password using BCrypt
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setRole(request.getRole());

        return userRepo.save(user);
    }

    // LOGIN
    public Authentication login(LoginRequest request) {

        // Create an unauthenticated authentication object
        Authentication authenticationRequest =
                new UsernamePasswordAuthenticationToken(
                        request.getIdentifier(),
                        request.getPassword()
                );

        // AuthenticationManager delegates to DaoAuthenticationProvider
        // DaoAuthenticationProvider calls UserDetailsService and PasswordEncoder
        return authenticationManager.authenticate(
                authenticationRequest
        );
    }
}
