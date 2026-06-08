import 'package:http/http.dart' as http;
import 'api_service.dart';

class BalanceService extends ApiService {
  Future<double> getTotalBalance() async {
    final response = await http.get(
      Uri.parse('$baseUrl/balance'),
      headers: {
        'Authorization': 'Bearer ' + token!,
      }
    );
    if (response.statusCode == 200) {
      return double.parse(response.body);
    }
    return 0.0;
  }

  Future<double> getCashBalance() async {
    return 0.0;
  }

  Future<double> getBankBalance() async {
    return 0.0;
  }
}