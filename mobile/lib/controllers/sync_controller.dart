import 'package:shared_preferences/shared_preferences.dart';
import '../services/sync_service.dart';
import '../models/dbContext.dart';

class SyncController {
  final SyncService _syncService = SyncService();

  Future<List<Map<String, dynamic>>> syncData() async {
    print("🚀 Starting sync process...");
    List<Map<String, dynamic>> conflicts = [];
    try {
      final prefs = await SharedPreferences.getInstance();
      int lastSyncTime = prefs.getInt('last_sync_time') ?? 0;

      // ==========================================
      // PHASE 1: THE PULL (Server -> Local)
      // ==========================================
      final serverData = await _syncService.fetchSyncData(lastSyncTime);
      final db = await DbContext.db;
      
      if (serverData != null) {
        // 1. Process Categories
        if (serverData['categories'] != null) {
          for (var cat in serverData['categories']) {
            if (cat['deletedAt'] != null) {
              await db.delete('categories', where: 'serverId = ?', whereArgs: [cat['id']]);
            } else {
              final localCat = {
                'serverId': cat['id'],
                'nom': cat['nom'],
                'budgetLimit': cat['limit'],
                'updatedAt': cat['updatedAt'],
                'syncStatus': 1 // Synced
              };
              final exists = await db.query('categories', where: 'serverId = ? OR nom = ?', whereArgs: [cat['id'], cat['nom']]);
              if (exists.isNotEmpty) {
                await db.update('categories', localCat, where: 'localId = ?', whereArgs: [exists.first['localId']]);
              } else {
                await db.insert('categories', localCat);
              }
            }
          }
        }

        // 2. Process Comptes (Accounts)
        if (serverData['comptes'] != null) {
          for (var compte in serverData['comptes']) {
            if (compte['deletedAt'] != null) {
              await db.delete('comptes', where: 'serverId = ?', whereArgs: [compte['id']]);
            } else {
              final localCompte = {
                'serverId': compte['id'],
                'nom': compte['nom'],
                'type': compte['type'],
                'updatedAt': compte['updatedAt'],
                'syncStatus': 1
              };
              final exists = await db.query('comptes', where: 'serverId = ? OR nom = ?', whereArgs: [compte['id'], compte['nom']]);
              if (exists.isNotEmpty) {
                await db.update('comptes', localCompte, where: 'localId = ?', whereArgs: [exists.first['localId']]);
              } else {
                await db.insert('comptes', localCompte);
              }
            }
          }
        }

        // 3. Process Transactions
        if (serverData['transactions'] != null) {
          for (var tx in serverData['transactions']) {
            if (tx['deletedAt'] != null) {
              await db.delete('transactions', where: 'serverId = ?', whereArgs: [tx['id']]);
            } else {
              // Map serverIds to localIds for foreign keys
              final localCompte = await db.query('comptes', where: 'serverId = ?', whereArgs: [tx['compteId']]);
              final localCat = await db.query('categories', where: 'serverId = ?', whereArgs: [tx['categorieId']]);
              
              String mappedType = 'expense';
              if (tx['type'] == 'REVENU') mappedType = 'income';
              if (tx['type'] == 'TRANSFER') mappedType = 'transfer';
              if (tx['type'] == 'DEPENSE') mappedType = 'expense';

              final localTx = {
                'serverId': tx['id'],
                'amount': (tx['montant'] as num).abs(),
                'type': mappedType,
                'date': tx['date'],
                'description': tx['description'],
                'updatedAt': tx['updatedAt'],
                'syncStatus': 1,
                'compteId': localCompte.isNotEmpty ? localCompte.first['localId'] : null,
                'categorieId': localCat.isNotEmpty ? localCat.first['localId'] : null,
              };
              
              
              final exists = await db.query('transactions', where: 'serverId = ?', whereArgs: [tx['id']]);
              if (exists.isNotEmpty) {
                // Check for conflict: local was edited offline (syncStatus == 2)
                if (exists.first['syncStatus'] == 2) {
                   conflicts.add({
                     'serverData': localTx,
                     'localData': exists.first,
                   });
                   continue; // Skip applying server data for now
                } else {
                   await db.update('transactions', localTx, where: 'serverId = ?', whereArgs: [tx['id']]);
                }
              } else {
                await db.insert('transactions', localTx);
              }
            }
          }
        }

        // Save new timestamp
        if (serverData['serverTimestamp'] != null) {
           await prefs.setInt('last_sync_time', serverData['serverTimestamp']);
        }
      }

      // ==========================================
      // PHASE 2: THE PUSH (Local -> Server)
      // ==========================================
      
      // A. Push Pending Creates (syncStatus = 0)
      final pendingCreates = await db.query('transactions', where: 'syncStatus = 0');
      for (var tx in pendingCreates) {
        // Send serverIds to backend, not localIds
        final localCat = await db.query('categories', where: 'localId = ?', whereArgs: [tx['categorieId']]);
        final localCompte = await db.query('comptes', where: 'localId = ?', whereArgs: [tx['compteId']]);
        
        String mappedToServer = 'DEPENSE';
        if (tx['type'] == 'income') mappedToServer = 'REVENU';
        if (tx['type'] == 'expense') mappedToServer = 'DEPENSE';
        if (tx['type'] == 'transfer') mappedToServer = 'TRANSFER';

        final payload = {
          'montant': tx['amount'],
          'type': mappedToServer,
          'date': tx['date'],
          'description': tx['description'],
          'categorieId': localCat.isNotEmpty ? localCat.first['serverId'] : null,
          'compteId': localCompte.isNotEmpty ? localCompte.first['serverId'] : null,
        };

        final newServerId = await _syncService.createTransaction(payload);
        if (newServerId != null) {
          await db.update('transactions', {'syncStatus': 1, 'serverId': newServerId}, where: 'localId = ?', whereArgs: [tx['localId']]);
        }
      }

      // B. Push Pending Updates (syncStatus = 2)
      final pendingUpdates = await db.query('transactions', where: 'syncStatus = 2 AND serverId IS NOT NULL');
      for (var tx in pendingUpdates) {
        if (tx['deletedAt'] != null) {
           // It's a soft delete waiting to be pushed
           final success = await _syncService.deleteTransaction(tx['serverId'] as int);
           if (success) {
              // Delete permanently locally after successful push
              await db.delete('transactions', where: 'localId = ?', whereArgs: [tx['localId']]);
           }
        } else {
           // It's a normal update
           final localCat = await db.query('categories', where: 'localId = ?', whereArgs: [tx['categorieId']]);
           final payload = {
            'montant': tx['amount'],
            'description': tx['description'],
            'date': tx['date'],
            'categorieId': localCat.isNotEmpty ? localCat.first['serverId'] : null,
           };
           final success = await _syncService.updateTransaction(tx['serverId'] as int, payload);
           if (success) {
             await db.update('transactions', {'syncStatus': 1}, where: 'localId = ?', whereArgs: [tx['localId']]);
           }
        }
      }
      
      print("✅ Sync process completed successfully!");
      return conflicts;
    } catch (e) {
      print("❌ Sync failed: $e");
      return conflicts;
    }
  }

  Future<void> resolveConflicts(List<Map<String, dynamic>> conflicts, {required bool keepServer}) async {
    final db = await DbContext.db;
    for (var conflict in conflicts) {
      final serverTx = conflict['serverData'];
      final localTx = conflict['localData'];
      
      if (keepServer) {
        // Overwrite local with server data
        await db.update('transactions', serverTx, where: 'localId = ?', whereArgs: [localTx['localId']]);
      } else {
        // Keep local data (do nothing to DB, but push local to server)
        final localCat = await db.query('categories', where: 'localId = ?', whereArgs: [localTx['categorieId']]);
        final payload = {
          'montant': localTx['amount'],
          'description': localTx['description'],
          'date': localTx['date'],
          'categorieId': localCat.isNotEmpty ? localCat.first['serverId'] : null,
        };
        final success = await _syncService.updateTransaction(serverTx['serverId'] as int, payload);
        if (success) {
          await db.update('transactions', {'syncStatus': 1}, where: 'localId = ?', whereArgs: [localTx['localId']]);
        }
      }
    }
  }
}
