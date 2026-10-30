package com.desafio.eventos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Ponto de entrada da API REST do Gerenciador de Eventos.
 *
 * <p>Organização em camadas: {@code controller} (HTTP) → {@code service} (regras de negócio)
 * → {@code repository} (persistência JPA). A autenticação JWT fica em {@code security},
 * o tratamento de erros em {@code exception} e as configurações em {@code config}.
 */
@SpringBootApplication
public class GerenciadorEventosApplication {

    public static void main(String[] args) {
        SpringApplication.run(GerenciadorEventosApplication.class, args);
    }
}
