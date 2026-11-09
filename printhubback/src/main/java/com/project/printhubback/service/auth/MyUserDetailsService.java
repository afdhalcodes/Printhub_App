package com.project.printhubback.service.auth;

import com.project.printhubback.model.authentication.User;
import com.project.printhubback.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MyUserDetailsService implements UserDetailsService {

    private final UserRepo userRepo;

    public MyUserDetailsService(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {

        User user = userRepo
                .findByEmailOrUsername(identifier, identifier)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + identifier
                        )
                );

        return new UserPrincipal(user);
    }
}
