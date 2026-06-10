import '../models/categorie_model.dart';
import '../models/dbContext.dart';

class CategorieRepository {
  Future<List<CategorieModel>> getAllCategories() async {
    final db = await DbContext.db;
    return await db.query('categories', where: 'deletedAt IS NULL').then((maps) {
      return maps.map((map) => CategorieModel.fromDbMap(map)).toList();
    });
  }

  Future<int> addCategory(CategorieModel category) async {
    final db = await DbContext.db;
    category.syncStatus = 0; // pending create
    category.updatedAt = DateTime.now();
    return await db.insert('categories', category.toMap());
  }

  Future<int> updateCategory(CategorieModel category) async {
    final db = await DbContext.db;
    if (category.syncStatus == 1) {
      category.syncStatus = 2; // pending update
    }
    category.updatedAt = DateTime.now();
    return await db.update('categories', category.toMap(), where: 'localId = ?', whereArgs: [category.localId]);
  }

  Future<int> deleteCategory(int localId) async {
    final db = await DbContext.db;
    final now = DateTime.now().toIso8601String();
    return await db.update('categories', {
      'deletedAt': now,
      'updatedAt': now,
      'syncStatus': 2
    }, where: 'localId = ?', whereArgs: [localId]);
  }
}
