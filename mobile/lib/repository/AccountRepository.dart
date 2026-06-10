import 'package:mobile/models/dbContext.dart';
import 'package:mobile/models/compte_model.dart';

class AccountRepository {
  Future<List<CompteModel>> getAllAccounts() async {
    final db = await DbContext.db;
    return await db.query('accounts', where: 'deletedAt IS NULL').then((List<Map<String, dynamic>> maps) {
      return List.generate(maps.length, (int i) {
        return CompteModel.fromJson(maps[i]);
      });
    });
  }
}