package com.desafio.eventos.repository;

import com.desafio.eventos.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    List<Evento> findByAdministradorIdOrderByDataAsc(Long administradorId);
}
