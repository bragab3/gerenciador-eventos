package com.desafio.eventos.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Corpo de erro único da API, usado tanto pelo {@code GlobalExceptionHandler} quanto pelos
 * erros de segurança (401/403). Os clientes exibem {@code mensagem} ou {@code detalhes}.
 */
@Schema(description = "Formato padrão de erro da API")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErroResponse(
        LocalDateTime timestamp,
        int status,
        String erro,
        String mensagem,
        String caminho,
        List<String> detalhes) {

    public static ErroResponse of(HttpStatus status, String mensagem, String caminho, List<String> detalhes) {
        return new ErroResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                mensagem,
                caminho,
                detalhes);
    }
}
