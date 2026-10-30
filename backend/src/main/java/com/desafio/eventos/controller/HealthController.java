package com.desafio.eventos.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoint leve e público para verificar se a API está no ar. O frontend chama ao abrir a página
 * para "acordar" o servidor (hospedagens gratuitas desligam a API após um tempo sem uso).
 */
@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Verificação de disponibilidade da API")
public class HealthController {

    @GetMapping
    @Operation(summary = "Verifica se a API está no ar")
    public Map<String, String> status() {
        return Map.of("status", "UP");
    }
}
