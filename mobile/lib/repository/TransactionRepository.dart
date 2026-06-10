import '../models/transaction_model.dart';
import '../models/categorie_model.dart';
import '../models/dbContext.dart';

class TransactionRepository {
  Future<List<TransactionModel>> getAllTransactions() async {
    final db = await DbContext.db;
    return await db.query('transactions', where: 'deletedAt IS NULL').then((List<Map<String, dynamic>> maps) {
      return List.generate(maps.length, (int i) {
        return TransactionModel.fromDbMap(maps[i]);
      });
    });
  }

  Future<TransactionModel> getTransactionById(int id) async {
    final db = await DbContext.db;
    return await db.query('transactions', where: 'localId = ? and deletedAt IS NULL', whereArgs: [id]).then((List<Map<String, dynamic>> maps) {
      return TransactionModel.fromJson(maps[0]);
    });
  }

  Future<int> addTransaction(TransactionModel transaction) async {
    final db = await DbContext.db;
    
    // Offline first: 0 means "Pending Create" on the server
    transaction.syncStatus = 0; 
    transaction.updatedAt = DateTime.now();

    if (transaction.type == 'transfer') {
      final transferId = await db.insert('transfers', {
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
        'syncStatus': 0,
      });
      transaction.transferId = transferId;
    }

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

  Future<double> getBalance(int compteId) async {
    final db = await DbContext.db;
    final List<Map<String, dynamic>> maps = await db.query(
      'transactions',
      where: 'deletedAt IS NULL AND (compteId = ? OR idDestination = ?)',
      whereArgs: [compteId, compteId],
    );

    double balance = 0.0;
    for (final map in maps) {
      final tx = TransactionModel.fromDbMap(map);
      if (tx.type == 'income') {
        if (tx.compteId == compteId) {
          balance += tx.amount;
        }
      } else if (tx.type == 'expense') {
        if (tx.compteId == compteId) {
          balance -= tx.amount;
        }
      } else if (tx.type == 'transfer') {
        if (tx.compteId == compteId) {
          balance -= tx.amount;
        }
        if (tx.idDestination == compteId) {
          balance += tx.amount;
        }
      }
    }
    return balance;
  }

  Future<List<TransactionWithCategory>> getRecentTransactionsWithCategory({
    int limit = 10,
    int skip = 0,
  }) async {
    final db = await DbContext.db;
    
    final List<Map<String, dynamic>> maps = await db.rawQuery('''
      SELECT 
        t.*, 
        c.nom AS categoryName, 
        c.budgetLimit AS categoryBudgetLimit,
        c.updatedAt AS categoryUpdatedAt,
        c.deletedAt AS categoryDeletedAt,
        c.syncStatus AS categorySyncStatus,
        c.serverId AS categoryServerId
      FROM transactions t
      LEFT JOIN categories c ON t.categorieId = c.localId
      WHERE t.deletedAt IS NULL
      ORDER BY t.date DESC
      LIMIT ? OFFSET ?
    ''', [limit, skip]);

    return maps.map((map) {
      final transaction = TransactionModel.fromDbMap(map); 

      CategorieModel? category;
      if (map['categorieId'] != null) {
        category = CategorieModel(
          localId: map['categorieId'],
          serverId: map['categoryServerId'],
          nom: map['categoryName'] ?? 'Unknown',
          budgetLimit: map['categoryBudgetLimit'] != null 
              ? (map['categoryBudgetLimit'] as num).toDouble() 
              : null,
          updatedAt: map['categoryUpdatedAt'] != null 
              ? DateTime.parse(map['categoryUpdatedAt']) 
              : DateTime.now(),
          deletedAt: map['categoryDeletedAt'] != null 
              ? DateTime.parse(map['categoryDeletedAt']) 
              : null,
          syncStatus: map['categorySyncStatus'] ?? 1,
        );
      }

      return TransactionWithCategory(
        transaction: transaction,
        category: category,
      );
    }).toList();
  }

  Future<List<TransactionWithCategory>> getRecentTransactionsForBudget({
    int limit = 10,
    int skip = 0,
    DateTime? date,
    int? categorieId,
  }) async {
    final db = await DbContext.db;
    
    final List<Map<String, dynamic>> maps = await db.rawQuery('''
      SELECT 
        t.*, 
        c.nom AS categoryName, 
        c.budgetLimit AS categoryBudgetLimit,
        c.updatedAt AS categoryUpdatedAt,
        c.deletedAt AS categoryDeletedAt,
        c.syncStatus AS categorySyncStatus,
        c.serverId AS categoryServerId
      FROM transactions t
      LEFT JOIN categories c ON t.categorieId = c.localId
      WHERE t.deletedAt IS NULL
      AND t.type = 'expense'
      AND c.localId = ?
      AND t.date >= ?
      ORDER BY t.date DESC
      LIMIT ? OFFSET ?
    ''', [categorieId, date?.toIso8601String(), limit, skip]);

    return maps.map((map) {
      final transaction = TransactionModel.fromDbMap(map); 

      CategorieModel? category;
      if (map['categorieId'] != null) {
        category = CategorieModel(
          localId: map['categorieId'],
          serverId: map['categoryServerId'],
          nom: map['categoryName'] ?? 'Unknown',
          budgetLimit: map['categoryBudgetLimit'] != null 
              ? (map['categoryBudgetLimit'] as num).toDouble() 
              : null,
          updatedAt: map['categoryUpdatedAt'] != null 
              ? DateTime.parse(map['categoryUpdatedAt']) 
              : DateTime.now(),
          deletedAt: map['categoryDeletedAt'] != null 
              ? DateTime.parse(map['categoryDeletedAt']) 
              : null,
          syncStatus: map['categorySyncStatus'] ?? 1,
        );
      }

      return TransactionWithCategory(
        transaction: transaction,
        category: category,
      );
    }).toList();
  }
}