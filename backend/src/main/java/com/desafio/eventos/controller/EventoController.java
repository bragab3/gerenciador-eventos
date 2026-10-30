package com.desafio.eventos.controller;

import com.desafio.eventos.dto.EventoRequest;
import com.desafio.eventos.dto.EventoResponse;
import com.desafio.eventos.dto.EventoUpdateRequest;
import com.desafio.eventos.security.AdminPrincipal;
import com.desafio.eventos.service.EventoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * CRUD de eventos. Todas as rotas exigem JWT; o administrador autenticado é injetado via
 * {@link AuthenticationPrincipal} e repassado ao service para a verificação de propriedade.
 */
@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
@Tag(name = "Eventos", description = "CRUD de eventos do administrador autenticado (requer JWT)")
public class EventoController {

    private final EventoService eventoService;

    @GetMapping
    @Operation(summary = "Lista os eventos de um administrador",
            description = "Retorna todos os eventos associados ao adminId informado (deve ser o do token).")
    public List<EventoResponse> listar(
            @RequestParam("adminId") Long adminId,
            @Parameter(hidden = true) @AuthenticationPrincipal AdminPrincipal principal) {
        return eventoService.listarPorAdministrador(adminId, principal.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastra um evento",
            description = "Cria um evento (nome, data, localizacao, imagem) associado ao adminId informado.")
    public EventoResponse cadastrar(
            @Valid @RequestBody EventoRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal AdminPrincipal principal) {
        return eventoService.cadastrar(request, principal.getId());
    }

    @PatchMapping("/{eventoId}")
    @Operation(summary = "Atualiza data e/ou localização de um evento")
    public EventoResponse atualizar(
            @PathVariable("eventoId") Long eventoId,
            @Valid @RequestBody EventoUpdateRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal AdminPrincipal principal) {
        return eventoService.atualizar(eventoId, request, principal.getId());
    }

    @DeleteMapping("/{eventoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui um evento")
    public void excluir(
            @PathVariable("eventoId") Long eventoId,
            @Parameter(hidden = true) @AuthenticationPrincipal AdminPrincipal principal) {
        eventoService.excluir(eventoId, principal.getId());
    }
}
