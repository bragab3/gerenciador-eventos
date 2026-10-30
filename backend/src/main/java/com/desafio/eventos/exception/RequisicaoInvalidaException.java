package com.desafio.eventos.exception;

/**
 * Requisição sem as informações mínimas para a operação.
 * Convertida em HTTP 400 pelo {@link GlobalExceptionHandler}.
 */
public class RequisicaoInvalidaException extends RuntimeException {

    public RequisicaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
