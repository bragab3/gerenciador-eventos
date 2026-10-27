package com.desafio.eventos.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resposta do login: token JWT e dados do administrador")
public record LoginResponse(
        String token,
        String tipo,
        Long adminId,
        String nome,
        String email) {
}
