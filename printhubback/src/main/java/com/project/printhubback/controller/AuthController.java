
package com.project.printhubback.controller;

import com.project.printhubback.dto.LoginRequest;
import com.project.printhubback.dto.RegisterRequest;
import com.project.printhubback.model.authentication.User;
import com.project.printhubback.service.auth.AuthService;
import com.project.printhubback.service.auth.UserPrincipal;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository securityContextRepository;

    private final SecurityContextLogoutHandler logoutHandler =
            new SecurityContextLogoutHandler();

    public AuthController(
            AuthService authService,
            SecurityContextRepository securityContextRepository
    ) {
        this.authService = authService;
        this.securityContextRepository = securityContextRepository;
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request
    ) {

        try {

            User user = authService.register(request);

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "message", "Registration successful",
                            "username", user.getUsername(),
                            "email", user.getEmail(),
                            "role", user.getRole().name()
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );
        }
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {

        try {

            // Step 1: Authenticate the user
            Authentication authentication =
                    authService.login(request);

            // Step 2: Create SecurityContext
            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();

            // Step 3: Store authentication inside SecurityContext
            context.setAuthentication(authentication);

            // Step 4: Set context for the current request
            SecurityContextHolder.setContext(context);

            // Step 5: Create session and rotate session ID
            httpRequest.getSession(true);
            httpRequest.changeSessionId();

            // Step 6: Save SecurityContext in HttpSession
            securityContextRepository.saveContext(
                    context,
                    httpRequest,
                    httpResponse
            );

            UserPrincipal principal =
                    (UserPrincipal) authentication.getPrincipal();

            String role = authentication.getAuthorities()
                    .stream()
                    .findFirst()
                    .map(authority -> authority.getAuthority())
                    .orElse("");

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Login successful",
                            "username", principal.getUsername(),
                            "role", role
                    )
            );

        } catch (AuthenticationException e) {

            SecurityContextHolder.clearContext();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of(
                            "message",
                            "Invalid email/username or password"
                    )
            );
        }
    }

    // GET CURRENT LOGGED-IN USER
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        String role = principal.getAuthorities()
                .stream()
                .findFirst()
                .map(authority -> authority.getAuthority())
                .orElse("");

        return ResponseEntity.ok(
                Map.of(
                        "username", principal.getUsername(),
                        "role", role
                )
        );
    }

    // LOGOUT
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {

        logoutHandler.logout(
                request,
                response,
                authentication
        );

        return ResponseEntity.ok(
                Map.of("message", "Logout successful")
        );
    }

    // GET CSRF TOKEN
    @GetMapping("/csrf")
    public ResponseEntity<?> csrf(CsrfToken csrfToken) {

        return ResponseEntity.ok(
                Map.of("token", csrfToken.getToken())
        );
    }

}
