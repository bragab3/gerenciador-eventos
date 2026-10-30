package com.desafio.eventos.repository;

import com.desafio.eventos.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Persistência de eventos.
 */
public interface EventoRepository extends JpaRepository<Evento, Long> {

    /** Eventos de um administrador, ordenados pela data (mais próximos primeiro). */
    List<Evento> findByAdministradorIdOrderByDataAsc(Long administradorId);
}
