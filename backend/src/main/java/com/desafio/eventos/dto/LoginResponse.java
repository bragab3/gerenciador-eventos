package com.desafio.eventos.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Resposta do login. O cliente envia o {@code token} no header
 * {@code Authorization: Bearer <token>} nas requisições seguintes.
 */
@Schema(description = "Resposta do login: token JWT e dados do administrador")
public record LoginResponse(
        String token,
        String tipo,
        Long adminId,
        String nome,
        String email) {
}
