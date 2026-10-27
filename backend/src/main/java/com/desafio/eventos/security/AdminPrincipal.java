package com.desafio.eventos.security;

import com.desafio.eventos.entity.Administrador;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Usuário autenticado (principal do Spring Security). Carrega o id do administrador
 * para que controllers/services saibam "quem" está chamando a API.
 */
@Getter
@RequiredArgsConstructor
public class AdminPrincipal implements UserDetails {

    private final Long id;
    private final String nome;
    private final String email;
    private final String senha;

    public static AdminPrincipal from(Administrador administrador) {
        return new AdminPrincipal(
                administrador.getId(),
                administrador.getNome(),
                administrador.getEmail(),
                administrador.getSenha());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
