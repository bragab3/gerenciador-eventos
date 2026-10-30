package com.desafio.eventos.repository;

import com.desafio.eventos.entity.Administrador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Persistência de administradores. As consultas são derivadas do nome do método pelo Spring Data JPA.
 */
public interface AdministradorRepository extends JpaRepository<Administrador, Long> {

    Optional<Administrador> findByEmail(String email);

    boolean existsByEmail(String email);
}
