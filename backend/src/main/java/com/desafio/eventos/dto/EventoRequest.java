package com.desafio.eventos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EventoRequest(
        @Schema(description = "Título do evento", example = "Feira de Tecnologia")
        @NotBlank(message = "O nome do evento é obrigatório")
        @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "Data no formato yyyy-MM-dd", example = "2026-12-15")
        @NotNull(message = "A data é obrigatória")
        LocalDate data,

        @Schema(example = "Centro de Convenções, São Paulo")
        @NotBlank(message = "A localização é obrigatória")
        @Size(max = 255, message = "A localização deve ter no máximo 255 caracteres")
        String localizacao,

        @Schema(description = "URL da imagem ou imagem em Base64 (data URI). Opcional.",
                example = "https://exemplo.com/imagem.jpg")
        String imagem,

        @Schema(description = "Id do administrador dono do evento", example = "1")
        @NotNull(message = "O adminId é obrigatório")
        Long adminId) {
}
