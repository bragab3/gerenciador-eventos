package com.desafio.eventos.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Emissão e validação de tokens JWT assinados com HMAC-SHA.
 * O token carrega o email (subject), o {@code adminId} e o nome; a chave e a validade vêm de
 * {@code app.jwt.secret} e {@code app.jwt.expiration-ms}.
 */
@Service
public class JwtService {

    private final SecretKey chave;
    private final long expiracaoMs;

    public JwtService(@Value("${app.jwt.secret}") String segredoBase64,
                      @Value("${app.jwt.expiration-ms}") long expiracaoMs) {
        this.chave = Keys.hmacShaKeyFor(Decoders.BASE64.decode(segredoBase64));
        this.expiracaoMs = expiracaoMs;
    }

    public String gerarToken(AdminPrincipal admin) {
        Date agora = new Date();
        return Jwts.builder()
                .subject(admin.getUsername())
                .claim("adminId", admin.getId())
                .claim("nome", admin.getNome())
                .issuedAt(agora)
                .expiration(new Date(agora.getTime() + expiracaoMs))
                .signWith(chave)
                .compact();
    }

    /**
     * Valida o token e monta o usuário autenticado direto das claims (id, nome e email),
     * sem consultar o banco a cada requisição.
     *
     * @throws JwtException se o token for inválido, adulterado ou estiver expirado
     */
    public AdminPrincipal extrairAdmin(String token) {
        Claims claims = lerClaims(token);
        Long adminId = claims.get("adminId", Long.class);
        if (adminId == null || claims.getSubject() == null) {
            throw new JwtException("Token sem as claims esperadas.");
        }
        return new AdminPrincipal(adminId, claims.get("nome", String.class), claims.getSubject(), null);
    }

    private Claims lerClaims(String token) {
        return Jwts.parser()
                .verifyWith(chave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
