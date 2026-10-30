package com.desafio.eventos.exception;

/**
 * Recurso inexistente (ex.: evento ou administrador não encontrado).
 * Convertida em HTTP 404 pelo {@link GlobalExceptionHandler}.
 */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
