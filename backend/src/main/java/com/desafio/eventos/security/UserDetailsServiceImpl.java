package com.desafio.eventos.security;

import com.desafio.eventos.repository.AdministradorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Carrega o administrador pelo email para o Spring Security durante o login.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final AdministradorRepository administradorRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return administradorRepository.findByEmail(email)
                .map(AdminPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("Administrador não encontrado: " + email));
    }
}
