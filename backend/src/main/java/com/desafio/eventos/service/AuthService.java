package com.desafio.eventos.service;

import com.desafio.eventos.dto.AdministradorRequest;
import com.desafio.eventos.dto.AdministradorResponse;
import com.desafio.eventos.dto.LoginRequest;
import com.desafio.eventos.dto.LoginResponse;
import com.desafio.eventos.entity.Administrador;
import com.desafio.eventos.exception.EmailJaCadastradoException;
import com.desafio.eventos.repository.AdministradorRepository;
import com.desafio.eventos.security.AdminPrincipal;
import com.desafio.eventos.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AdministradorRepository administradorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AdministradorResponse cadastrar(AdministradorRequest request) {
        String email = normalizarEmail(request.email());

        if (administradorRepository.existsByEmail(email)) {
            throw new EmailJaCadastradoException(email);
        }

        Administrador administrador = Administrador.builder()
                .nome(request.nome().trim())
                .email(email)
                .senha(passwordEncoder.encode(request.senha()))
                .build();

        return AdministradorResponse.from(administradorRepository.save(administrador));
    }

    public LoginResponse login(LoginRequest request) {
        String email = normalizarEmail(request.email());

        // Lança BadCredentialsException (tratada no GlobalExceptionHandler -> 401) se email/senha estiverem errados
        Authentication autenticacao = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.senha()));

        AdminPrincipal admin = (AdminPrincipal) autenticacao.getPrincipal();
        String token = jwtService.gerarToken(admin);

        return new LoginResponse(token, "Bearer", admin.getId(), admin.getNome(), admin.getEmail());
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
