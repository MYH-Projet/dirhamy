import 'package:mobile/models/dbContext.dart';
import 'package:mobile/models/compte_model.dart';

class AccountRepository {
  Future<List<CompteModel>> getAllAccounts() async {
    final db = await DbContext.db;
    return await db.query('comptes', where: 'deletedAt IS NULL').then((List<Map<String, dynamic>> maps) {
      return List.generate(maps.length, (int i) {
        return CompteModel.fromDbMap(maps[i]);
      });
    });
  }
}