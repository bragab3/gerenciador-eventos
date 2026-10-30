package com.desafio.eventos.dto;

import com.desafio.eventos.entity.Administrador;

/**
 * Dados públicos do administrador (sem o hash da senha).
 */
public record AdministradorResponse(Long id, String nome, String email) {

    public static AdministradorResponse from(Administrador administrador) {
        return new AdministradorResponse(administrador.getId(), administrador.getNome(), administrador.getEmail());
    }
}
