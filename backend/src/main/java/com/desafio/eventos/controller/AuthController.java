package com.desafio.eventos.controller;

import com.desafio.eventos.dto.AdministradorRequest;
import com.desafio.eventos.dto.AdministradorResponse;
import com.desafio.eventos.dto.ErroResponse;
import com.desafio.eventos.dto.LoginRequest;
import com.desafio.eventos.dto.LoginResponse;
import com.desafio.eventos.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints públicos de autenticação: login (emite o JWT) e cadastro de administrador.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Login e cadastro de administradores (endpoints públicos)")
@SecurityRequirements // remove a exigência de token no Swagger para estes endpoints
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login de administrador",
            description = "Autentica com email e senha e retorna o token JWT e o adminId.")
    @ApiResponse(responseCode = "200", description = "Login realizado")
    @ApiResponse(responseCode = "401", description = "Email ou senha inválidos",
            content = @Content(schema = @Schema(implementation = ErroResponse.class)))
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/cadastro")
    @Operation(summary = "Cadastro de administrador",
            description = "Cria um administrador com a senha criptografada (BCrypt). Endpoint público para o primeiro acesso.")
    @ApiResponse(responseCode = "201", description = "Administrador criado")
    @ApiResponse(responseCode = "409", description = "Email já cadastrado",
            content = @Content(schema = @Schema(implementation = ErroResponse.class)))
    public ResponseEntity<AdministradorResponse> cadastrar(@Valid @RequestBody AdministradorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastrar(request));
    }
}
