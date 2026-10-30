package com.desafio.eventos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corpo de {@code POST /api/auth/cadastro}. Validado com Bean Validation antes de chegar ao service;
 * o limite de 72 caracteres da senha corresponde ao máximo considerado pelo BCrypt.
 */
public record AdministradorRequest(
        @Schema(example = "Maria Silva")
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres")
        String nome,

        @Schema(example = "maria@email.com")
        @NotBlank(message = "O email é obrigatório")
        @Email(message = "Email inválido")
        @Size(max = 160, message = "O email deve ter no máximo 160 caracteres")
        String email,

        @Schema(example = "senha123")
        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, max = 72, message = "A senha deve ter entre 6 e 72 caracteres")
        String senha) {
}
