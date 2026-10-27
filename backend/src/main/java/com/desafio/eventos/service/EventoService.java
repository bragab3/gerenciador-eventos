package com.desafio.eventos.service;

import com.desafio.eventos.dto.EventoRequest;
import com.desafio.eventos.dto.EventoResponse;
import com.desafio.eventos.dto.EventoUpdateRequest;
import com.desafio.eventos.entity.Administrador;
import com.desafio.eventos.entity.Evento;
import com.desafio.eventos.exception.AcessoNegadoException;
import com.desafio.eventos.exception.RecursoNaoEncontradoException;
import com.desafio.eventos.exception.RequisicaoInvalidaException;
import com.desafio.eventos.repository.AdministradorRepository;
import com.desafio.eventos.repository.EventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final AdministradorRepository administradorRepository;

    @Transactional(readOnly = true)
    public List<EventoResponse> listarPorAdministrador(Long adminId, Long adminAutenticadoId) {
        garantirMesmoAdministrador(adminId, adminAutenticadoId);

        return eventoRepository.findByAdministradorIdOrderByDataAsc(adminId).stream()
                .map(EventoResponse::from)
                .toList();
    }

    @Transactional
    public EventoResponse cadastrar(EventoRequest request, Long adminAutenticadoId) {
        garantirMesmoAdministrador(request.adminId(), adminAutenticadoId);

        Administrador administrador = administradorRepository.findById(request.adminId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Administrador não encontrado: " + request.adminId()));

        Evento evento = Evento.builder()
                .nome(request.nome().trim())
                .data(request.data())
                .localizacao(request.localizacao().trim())
                .imagem(normalizarImagem(request.imagem()))
                .administrador(administrador)
                .build();

        return EventoResponse.from(eventoRepository.save(evento));
    }

    @Transactional
    public EventoResponse atualizar(Long eventoId, EventoUpdateRequest request, Long adminAutenticadoId) {
        boolean semData = request.data() == null;
        boolean semLocalizacao = request.localizacao() == null || request.localizacao().isBlank();

        if (semData && semLocalizacao) {
            throw new RequisicaoInvalidaException("Informe ao menos 'data' ou 'localizacao' para atualizar o evento.");
        }

        Evento evento = buscarEventoDoAdministrador(eventoId, adminAutenticadoId);

        if (!semData) {
            evento.setData(request.data());
        }
        if (!semLocalizacao) {
            evento.setLocalizacao(request.localizacao().trim());
        }

        return EventoResponse.from(eventoRepository.save(evento));
    }

    @Transactional
    public void excluir(Long eventoId, Long adminAutenticadoId) {
        Evento evento = buscarEventoDoAdministrador(eventoId, adminAutenticadoId);
        eventoRepository.delete(evento);
    }

    private Evento buscarEventoDoAdministrador(Long eventoId, Long adminAutenticadoId) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Evento não encontrado: " + eventoId));

        if (!evento.getAdministrador().getId().equals(adminAutenticadoId)) {
            throw new AcessoNegadoException("Este evento pertence a outro administrador.");
        }
        return evento;
    }

    private void garantirMesmoAdministrador(Long adminId, Long adminAutenticadoId) {
        if (!adminAutenticadoId.equals(adminId)) {
            throw new AcessoNegadoException("Você só pode listar ou cadastrar eventos do seu próprio administrador.");
        }
    }

    private String normalizarImagem(String imagem) {
        return (imagem == null || imagem.isBlank()) ? null : imagem.trim();
    }
}
