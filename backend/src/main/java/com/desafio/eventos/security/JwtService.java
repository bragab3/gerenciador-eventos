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
     * Valida assinatura e expiração e devolve o email (subject) do token.
     *
     * @throws JwtException se o token for inválido, adulterado ou estiver expirado
     */
    public String extrairEmail(String token) {
        return lerClaims(token).getSubject();
    }

    private Claims lerClaims(String token) {
        return Jwts.parser()
                .verifyWith(chave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
