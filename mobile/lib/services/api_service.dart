import 'package:flutter_dotenv/flutter_dotenv.dart';

abstract class ApiService {
  final String baseUrl = dotenv.env['BASE_URL'] ?? "http://localhost:3000/api"; 
}