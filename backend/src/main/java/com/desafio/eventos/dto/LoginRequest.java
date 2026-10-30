package com.desafio.eventos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Corpo de {@code POST /api/auth/login}.
 */
public record LoginRequest(
        @Schema(example = "maria@email.com")
        @NotBlank(message = "O email é obrigatório")
        @Email(message = "Email inválido")
        String email,

        @Schema(example = "senha123")
        @NotBlank(message = "A senha é obrigatória")
        String senha) {
}
