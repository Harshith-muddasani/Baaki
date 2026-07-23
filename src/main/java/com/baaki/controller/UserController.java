package com.baaki.controller;

import com.baaki.dto.user.CreateUserRequest;
import com.baaki.dto.user.UpdateUserRequest;
import com.baaki.dto.user.UserResponse;
import com.baaki.entity.User;
import com.baaki.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@PostMapping
	public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request,
			UriComponentsBuilder uriBuilder) {
		User user = userService.createUser(request.name(), request.email(), request.password());
		var location = uriBuilder.path("/users/{id}").buildAndExpand(user.getId()).toUri();
		return ResponseEntity.created(location).body(UserResponse.from(user));
	}

	@GetMapping("/{id}")
	public UserResponse getUser(@PathVariable Long id) {
		return UserResponse.from(userService.getUser(id));
	}

	@GetMapping
	public List<UserResponse> listUsers() {
		return userService.listUsers().stream().map(UserResponse::from).toList();
	}

	@PutMapping("/{id}")
	public UserResponse updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
		return UserResponse.from(userService.updateUser(id, request.name()));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
		userService.deleteUser(id);
		return ResponseEntity.noContent().build();
	}
}
