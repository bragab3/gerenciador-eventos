package com.desafio.eventos.exception;

/**
 * Cadastro com um email que já pertence a outro administrador.
 * Convertida em HTTP 409 pelo {@link GlobalExceptionHandler}.
 */
public class EmailJaCadastradoException extends RuntimeException {

    public EmailJaCadastradoException(String email) {
        super("Já existe um administrador cadastrado com o email: " + email);
    }
}
