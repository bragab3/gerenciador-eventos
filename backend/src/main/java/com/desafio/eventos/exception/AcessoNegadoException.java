package com.desafio.eventos.exception;

/**
 * O administrador autenticado tentou acessar dados de outro administrador.
 * Convertida em HTTP 403 pelo {@link GlobalExceptionHandler}.
 */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
