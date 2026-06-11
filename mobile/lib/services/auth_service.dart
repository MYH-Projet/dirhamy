import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthService {
  String get baseUrl => '${dotenv.env['BASE_URL'] ?? 'https://dirhamy.com/api'}/auth';
  
  static const _storage = FlutterSecureStorage();
  static const String cookieKey = 'auth_cookie';

  // Helper method to extract and save the cookie from the response
  Future<void> _extractAndSaveCookie(http.Response response) async {
    final setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader != null && setCookieHeader.isNotEmpty) {
      // We extract the actual cookie value to send in future requests
      final List<String> parts = setCookieHeader.split(';');
      final String primaryCookie = parts.first; // e.g. "token=eyJhb..."
      await _storage.write(key: cookieKey, value: primaryCookie);
    }
  }

  // Get the stored cookie to inject into other HTTP requests
  static Future<String?> getStoredCookie() async {
    return await _storage.read(key: cookieKey);
  }

  Future<String?> login(String mail, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'mail': mail, 'password': password}),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        await _extractAndSaveCookie(response);
        print('Login success');
        return null; // Success
      } else {
        try {
          final data = jsonDecode(response.body);
          return data['error'] ?? data['message'] ?? 'Login failed (${response.statusCode})';
        } catch (_) {
          return 'Login failed (${response.statusCode})';
        }
      }
    } catch (e) {
      return 'Network error: Unable to connect to server';
    }
  }

  Future<String?> register(String nom, String prenom, String mail, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'nom': nom,
          'prenom': prenom,
          'mail': mail,
          'password': password
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await _extractAndSaveCookie(response);
        return null; // Success
      } else {
        try {
          final data = jsonDecode(response.body);
          return data['error'] ?? data['message'] ?? 'Registration failed (${response.statusCode})';
        } catch (_) {
          return 'Registration failed (${response.statusCode})';
        }
      }
    } catch (e) {
      return 'Network error: Unable to connect to server';
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: cookieKey);
  }

  Future<bool> isAuthenticated() async {
    final cookie = await _storage.read(key: cookieKey);
    return cookie != null && cookie.isNotEmpty;
  }
}

