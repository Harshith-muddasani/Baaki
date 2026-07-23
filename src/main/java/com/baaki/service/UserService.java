package com.baaki.service;

import com.baaki.entity.User;
import com.baaki.exception.DuplicateResourceException;
import com.baaki.exception.ResourceNotFoundException;
import com.baaki.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public User createUser(String name, String email, String rawPassword) {
		if (userRepository.existsByEmail(email)) {
			throw new DuplicateResourceException("Email already registered: " + email);
		}
		User user = new User(name, email, passwordEncoder.encode(rawPassword));
		return userRepository.save(user);
	}

	@Transactional(readOnly = true)
	public User getUser(Long id) {
		return userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
	}

	@Transactional(readOnly = true)
	public List<User> listUsers() {
		return userRepository.findAll();
	}

	@Transactional
	public User updateUser(Long id, String name) {
		User user = getUser(id);
		user.setName(name);
		return user;
	}

	@Transactional
	public void deleteUser(Long id) {
		if (!userRepository.existsById(id)) {
			throw new ResourceNotFoundException("User not found: " + id);
		}
		userRepository.deleteById(id);
	}
}
