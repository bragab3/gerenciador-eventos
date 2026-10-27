package com.desafio.eventos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Atualização parcial: informe data, localizacao ou ambos")
public record EventoUpdateRequest(
        @Schema(description = "Nova data (yyyy-MM-dd)", example = "2026-12-20")
        LocalDate data,

        @Schema(example = "Pavilhão de Exposições, Campinas")
        @Size(max = 255, message = "A localização deve ter no máximo 255 caracteres")
        String localizacao) {
}
