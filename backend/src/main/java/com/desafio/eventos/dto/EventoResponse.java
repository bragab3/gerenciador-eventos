package com.desafio.eventos.dto;

import com.desafio.eventos.entity.Evento;

import java.time.LocalDate;

public record EventoResponse(
        Long id,
        String nome,
        LocalDate data,
        String localizacao,
        String imagem,
        Long adminId) {

    public static EventoResponse from(Evento evento) {
        return new EventoResponse(
                evento.getId(),
                evento.getNome(),
                evento.getData(),
                evento.getLocalizacao(),
                evento.getImagem(),
                evento.getAdministrador().getId());
    }
}
