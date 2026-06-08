



import '../models/transaction_model.dart';
import '../models/dbContext.dart';

class TransactionRepository {
  Future<List<TransactionModel>> getAllTransactions() async {
    final db = await DbContext.db;
    return await db.query('transactions', where: 'deletedAt IS NULL').then((List<Map<String, dynamic>> maps) {
      return List.generate(maps.length, (int i) {
        return TransactionModel.fromJson(maps[i]);
      });
    });
  }

  Future<TransactionModel> getTransactionById(int id) async {
    final db = await DbContext.db;
    return await db.query('transactions', where: 'localId = ?', whereArgs: [id]).then((List<Map<String, dynamic>> maps) {
      return TransactionModel.fromJson(maps[0]);
    });
  }

  Future<int> addTransaction(TransactionModel transaction) async {
    final db = await DbContext.db;
    
    // Offline first: 0 means "Pending Create" on the server
    transaction.syncStatus = 0; 
    transaction.updatedAt = DateTime.now();

    return await db.insert('transactions', transaction.toMap());
  }

  Future<int> updateTransaction(TransactionModel transaction) async {
    final db = await DbContext.db;
    
    // If it was already synced (1), mark it as "Pending Update" (2). 
    // If it was still "Pending Create" (0), keep it as 0.
    if (transaction.syncStatus == 1) {
      transaction.syncStatus = 2;
    }
    transaction.updatedAt = DateTime.now();

    return await db.update(
      'transactions', 
      transaction.toMap(), 
      where: 'localId = ?', 
      whereArgs: [transaction.localId]
    );
  }

  Future<int> deleteTransaction(int id) async {
    final db = await DbContext.db;
    final now = DateTime.now().toIso8601String();
    
    // Soft delete: set deletedAt, and mark as "Pending Update" (2) so the sync engine pushes the deletion
    return await db.update(
      'transactions', 
      {
        'deletedAt': now,
        'updatedAt': now,
        'syncStatus': 2 
      }, 
      where: 'localId = ?', 
      whereArgs: [id]
    );
  }
}