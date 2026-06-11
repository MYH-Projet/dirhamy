import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_service.dart';

class SyncService {
  String get baseUrl => dotenv.env['BASE_URL'] ?? 'https://dirhamy.com/api';

  Future<Map<String, dynamic>?> fetchSyncData(int since) async {
    final cookie = await AuthService.getStoredCookie();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/sync?since=$since'),
        headers: {
          'Content-Type': 'application/json',
          if (cookie != null) 'Cookie': cookie,
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Sync PULL error: $e");
    }
    return null;
  }

  Future<int?> createTransaction(Map<String, dynamic> txData) async {
    final cookie = await AuthService.getStoredCookie();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/transactions'),
        headers: {
          'Content-Type': 'application/json',
          if (cookie != null) 'Cookie': cookie,
        },
        body: jsonEncode(txData),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return data['id'] ?? data['data']?['id'];
      }
    } catch (e) {
      print("Sync PUSH create error: $e");
    }
    return null;
  }

  Future<bool> updateTransaction(int serverId, Map<String, dynamic> txData) async {
    final cookie = await AuthService.getStoredCookie();
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/transactions/$serverId'),
        headers: {
          'Content-Type': 'application/json',
          if (cookie != null) 'Cookie': cookie,
        },
        body: jsonEncode(txData),
      );
      return response.statusCode == 200;
    } catch (e) {
      print("Sync PUSH update error: $e");
      return false;
    }
  }

  Future<bool> deleteTransaction(int serverId) async {
    final cookie = await AuthService.getStoredCookie();
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/transactions/$serverId'),
        headers: {
          'Content-Type': 'application/json',
          if (cookie != null) 'Cookie': cookie,
        },
      );
      return response.statusCode == 200;
    } catch (e) {
      print("Sync PUSH delete error: $e");
      return false;
    }
  }
}
