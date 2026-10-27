package com.desafio.eventos.exception;

public class EmailJaCadastradoException extends RuntimeException {

    public EmailJaCadastradoException(String email) {
        super("Já existe um administrador cadastrado com o email: " + email);
    }
}
