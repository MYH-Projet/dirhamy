import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthController extends ChangeNotifier {
  static final AuthController _instance = AuthController._internal();
  factory AuthController() => _instance;
  AuthController._internal() {
    checkAuth();
  }

  final AuthService _authService = AuthService();
  bool isAuthenticated = false;
  bool isLoading = true;

  Future<void> checkAuth() async {
    isLoading = true;
    notifyListeners();
    isAuthenticated = await _authService.isAuthenticated();
    isLoading = false;
    notifyListeners();
  }

  Future<String?> login(String mail, String password) async {
    isLoading = true;
    notifyListeners();
    final errorMessage = await _authService.login(mail, password);
    if (errorMessage == null) {
      isAuthenticated = true;
    }
    isLoading = false;
    notifyListeners();
    return errorMessage;
  }

  Future<String?> register(String nom, String prenom, String mail, String password) async {
    isLoading = true;
    notifyListeners();
    final errorMessage = await _authService.register(nom, prenom, mail, password);
    isLoading = false;
    notifyListeners();
    return errorMessage;
  }

  Future<void> logout() async {
    await _authService.logout();
    isAuthenticated = false;
    notifyListeners();
  }
}
